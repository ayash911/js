const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// Middleware to serve static files
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "1234", 
  database: "rouletteDB",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database");
});

// User Signup Route
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  // Check if username already exists
  const checkQuery = "SELECT * FROM users WHERE username = ?";
  db.query(checkQuery, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error checking username");
    }

    if (result.length > 0) {
      return res.status(400).send("Username already exists");
    }

    // Hash the password and insert the new user
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error hashing password");
      }

      const query = "INSERT INTO users (username, password, balance) VALUES (?, ?, 1000)";
      db.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error inserting user");
        }
        res.status(201).send("User created successfully");
      });
    });
  });
});

// User Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error querying user" });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare the password with the hashed password in the database
    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error comparing passwords" });
      }

      if (isMatch) {
        const balance = result[0].balance; // Assuming `balance` exists in the database
        res.status(200).json({ message: "Login successful", balance });
      } else {
        res.status(400).json({ message: "Invalid password" });
      }
    });
  });
});

app.post("/update-balance", (req, res) => {
  const { username, amount, isAdd } = req.body;
  const query = isAdd
    ? "UPDATE users SET balance = balance + ? WHERE username = ?"
    : "UPDATE users SET balance = balance - ? WHERE username = ?";

  db.query(query, [amount, username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating balance" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Balance updated successfully" });
  });
});


// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
