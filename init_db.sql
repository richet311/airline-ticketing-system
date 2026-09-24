CREATE DATABASE IF NOT EXISTS practice_scratch_db;
USE practice_scratch_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username) VALUES ('first_test_user');
SELECT * FROM users;