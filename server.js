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

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error hashing password");
    }

    const query = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error inserting user");
      }
      res.status(201).send("User created successfully");
    });
  });
});

// User Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error querying user");
    }

    if (result.length === 0) {
      return res.status(400).send("User not found");
    }

    // Compare the password with the hashed password in the database
    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error comparing passwords");
      }

      if (isMatch) {
        res.status(200).send("Login successful");
      } else {
        res.status(400).send("Invalid password");
      }
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
