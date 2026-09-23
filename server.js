const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:");
    console.error(err);
    return;
  }

  console.log("Connected to MySQL successfully.");
});

app.get("/", (req, res) => {
  res.send("Airline Ticketing System API is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});