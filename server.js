const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS configuration
const corsOptions = {
  origin: "http://127.0.0.1:5500",  // Frontend URL
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'));

const pool = new Pool({
  user: "postgres",
  database: "ShadowWhisperer",
  password: "Z",  // Change to your actual DB password
  port: 5432,
});

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Define storage configuration for file uploads (for blogs)
const storageForBlogs = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);  // Save files to the uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);  // Use a unique filename
  }
});

// Initialize multer with the storage configuration for blog file uploads
const uploadBlogFiles = multer({
  storage: storageForBlogs,
  limits: { fileSize: 10 * 1024 * 1024 },  // Optional: limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|bmp|mp4|pdf|txt|doc|docx/;  // Acceptable file types
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);  // Accept the file
    } else {
      cb(new Error('Only image, video, PDF, DOC files are allowed!'), false);  // Reject if not allowed
    }
  }
});

// Register user
app.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password_hash, email, phone) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, password_hash, email, phone]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, "yourSecretKey", { expiresIn: "1h" });

    await pool.query("UPDATE users SET token = $1 WHERE id = $2", [token, user.id]);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password." });

    const token = jwt.sign({ id: user.id, username: user.username }, "yourSecretKey", { expiresIn: "1h" });
    await pool.query("UPDATE users SET token = $1 WHERE id = $2", [token, user.id]);

    res.status(200).json({ user: { id: user.id, username: user.username }, token });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Password recovery
app.post("/recover-password", async (req, res) => {
  const { recoverInput } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 OR phone = $1", [recoverInput]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: "No matching account found." });

    const recoveryLink = `http://localhost:3000/reset-password/${user.id}`;
    res.status(200).json({ recoveryLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Password reset form
app.get("/reset-password/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = result.rows[0];

    if (!user) return res.status(404).send("User not found");

    res.send(`
      <html>
        <body>
          <form action="/reset-password/${userId}" method="POST">
            <input type="password" name="new-password" placeholder="New Password" required />
            <button type="submit">Reset Password</button>
          </form>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});

// Save new password
app.post("/reset-password/:userId", async (req, res) => {
  const { userId } = req.params;
  const { "new-password": newPassword } = req.body;

  if (!newPassword) return res.status(400).send("New password is required.");

  try {
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newPasswordHash, userId]);
    res.send("Password has been successfully updated!");
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});

// Blog creation route with file uploads
app.post('/create-blog', uploadBlogFiles.array('fileUpload', 10), async (req, res) => {
  try {
    console.log(req.body);  // Logs form fields (e.g., title, content)
    console.log(req.files); // Logs the uploaded files

    const { title, content, visibility, user_id } = req.body;
    const files = req.files;  // Files uploaded under the 'fileUpload' field
    
    // Validate input
    if (!title || !content || !visibility || !user_id) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Insert the blog data into the 'blogs' table
    const result = await pool.query(
      "INSERT INTO blogs (title, content, visibility, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, content, visibility, user_id]
    );

    const blogId = result.rows[0].id;  // Get the generated blog ID

    // Insert file data into the 'blog_files' table for each uploaded file
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          "INSERT INTO blog_files (blog_id, file_path, file_name) VALUES ($1, $2, $3)",
          [blogId, file.path, file.originalname]
        );
      }
    }

    // Respond with the created blog and uploaded file information
    res.status(200).json({
      message: 'Blog created successfully!',
      data: {
        title,
        content,
        visibility,
        user_id,
        files: files.map(file => ({
          file_path: file.path,
          file_name: file.originalname
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating blog.' });
  }
});

app.get("/user/profile/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT username, email, profilePictureUrl FROM users WHERE id = $1',
      [userId]
    );    

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      username: user.username,
      email: user.email,
      profilePictureUrl: user.profile_picture_url || "bunny.jpg", // fallback
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/user/profile-picture", upload.single('profilePicture'), async (req, res) => {
  const userId = req.user.id;
  const fileUrl = `/uploads/${req.file.filename}`;
  await updateUserProfilePictureInDB(userId, fileUrl);
  res.json({ newProfilePictureUrl: fileUrl });
});


// Fetch Public Blogs
app.get("/blogs", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 10000; // Number of blogs per page
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      "SELECT * FROM blogs WHERE visibility = 'public' LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all public blogs with their associated files
app.get("/blogs-with-files", async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT 
        b.id AS blog_id,
        b.title,
        b.content,
        b.visibility,
        b.created_at,
        u.username AS publisher,
        COUNT(l.id) AS like_count,
        COALESCE(string_agg(bf.file_name, ','), '') AS files,
        COALESCE(string_agg(bf.file_path, ','), '') AS file_paths
    FROM blogs b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN likes l ON b.id = l.blog_id
    LEFT JOIN blog_files bf ON b.id = bf.blog_id
    WHERE b.visibility = 'public'
    GROUP BY b.id, b.title, b.content, b.visibility, b.created_at, u.username
    ORDER BY b.created_at DESC
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No blogs found." });
    }

    const blogsMap = {};

    result.rows.forEach(row => {
      if (!blogsMap[row.blog_id]) {
        blogsMap[row.blog_id] = {
          blog_id: row.blog_id,
          title: row.title,
          content: row.content,
          visibility: row.visibility,
          created_at: row.created_at,
          publisher: row.publisher,
          like_count: row.like_count,
          files: []
        };
      }

      if (row.file_name && row.file_path) {
        blogsMap[row.blog_id].files.push({
          file_name: row.file_name,
          file_path: row.file_path
        });
      }
    });

    const blogsArray = Object.values(blogsMap);
    res.status(200).json(blogsArray);
  } catch (err) {
    console.error("Error fetching blogs with files:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Like a Blog
app.post("/blogs/:id/like", async (req, res) => {
  const blogId = req.params.id;
  const { user_id } = req.body;

  try {
    const existingLike = await pool.query(
      "SELECT * FROM likes WHERE blog_id = $1 AND user_id = $2",
      [blogId, user_id]
    );

    if (existingLike.rows.length > 0) {
      return res.status(400).json({ message: "You have already liked this blog" });
    }

    await pool.query(
      "INSERT INTO likes (blog_id, user_id) VALUES ($1, $2)",
      [blogId, user_id]
    );

    await pool.query(
      "UPDATE blogs SET likes = likes + 1 WHERE id = $1",
      [blogId]
    );

    res.status(201).json({ message: "Blog liked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment on a Blog
app.post("/blogs/:id/comments", async (req, res) => {
  const blogId = req.params.id;
  const { content, user_id, parent_comment_id = null } = req.body;

  try {
    await pool.query(
      "INSERT INTO comments (blog_id, content, user_id, parent_comment_id) VALUES ($1, $2, $3, $4)",
      [blogId, content, user_id, parent_comment_id]
    );

    res.status(201).json({ message: "Comment added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Blog Comments
app.get("/blogs/:id/comments", async (req, res) => {
  const blogId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT * FROM comments WHERE blog_id = $1 ORDER BY created_at ASC",
      [blogId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to Comment
app.post("/comments/:id/respond", async (req, res) => {
  const commentId = req.params.id;
  const { content, user_id } = req.body;

  try {
    await pool.query(
      "INSERT INTO comments (content, user_id, parent_comment_id) VALUES ($1, $2, $3)",
      [content, user_id, commentId]
    );

    res.status(201).json({ message: "Reply added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
