const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite database');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send('Server error');
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], (err) => {
            if (err) return res.status(400).send('Username taken');
            res.send('User registered');
        });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(400).send('User not found');
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) res.send('Login successful');
            else res.status(400).send('Incorrect password');
        });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
