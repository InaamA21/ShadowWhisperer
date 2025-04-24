const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();

// CORS configuration to allow localhost:5500 to make requests
const corsOptions = {
  origin: "http://localhost:5500", // Allow requests from localhost:5500
  methods: "GET, POST, PUT, DELETE, OPTIONS", // Allow GET, POST, PUT, DELETE, and OPTIONS methods
  allowedHeaders: "Content-Type, Authorization", // Allow these headers
  credentials: true, // Allow credentials (cookies, authorization headers)
};

// Use CORS middleware with specified options
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(bodyParser.json());

// PostgreSQL pool configuration
const pool = new Pool({
  user: "Shadow_owner",
  database: "ShadowWhisper",
  password: "ShadowZ",
  port: 5432,
});

// Register User API
app.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password_hash, email, phone) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, password_hash, email, phone]
    );

    res.status(201).json(result.rows[0]); // Return the created user
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handle OPTIONS requests (Preflight request)
app.options('*', cors(corsOptions));

// Start server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
