const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ingle62",
    database: "devguard"
});

db.connect((err) => {
    if (err) {
        console.log("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

app.get("/", (req, res) => {
    res.json({
        message: "DevGuard Backend is running!"
    });
});
app.post("/projects", (req, res) => {
    const { name, github_url } = req.body;

    const sql = `
        INSERT INTO projects (name, github_url)
        VALUES (?, ?)
    `;

    db.query(sql, [name, github_url], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Failed to add project"
            });
        }

        res.json({
            message: "Project added successfully",
            projectId: result.insertId
        });
    });
});
app.listen(5000, () => {
    console.log("DevGuard server running on port 5000");
});