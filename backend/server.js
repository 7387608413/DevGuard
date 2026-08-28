const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "devguard",
    password: "devguard123",
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

app.get("/projects", (req, res) => {
    db.query(
        "SELECT * FROM projects ORDER BY id DESC",
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to load projects"
                });
            }

            res.json(results);
        }
    );
});

app.post("/projects", (req, res) => {
    const { name, github_url } = req.body;

    if (!name || !github_url) {
        return res.status(400).json({
            message: "Project name and GitHub URL are required"
        });
    }

    const sql = `
        INSERT INTO projects (name, github_url)
        VALUES (?, ?)
    `;

    db.query(sql, [name, github_url], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to add project"
            });
        }

        res.status(201).json({
            message: "Project added successfully",
            projectId: result.insertId
        });
    });
});

app.get("/deployments", (req, res) => {
    const sql = `
        SELECT
            deployments.id,
            projects.name AS project_name,
            deployments.version,
            deployments.status,
            deployments.deployed_at
        FROM deployments
        JOIN projects
            ON deployments.project_id = projects.id
        ORDER BY deployments.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load deployments"
            });
        }

        res.json(results);
    });
});

app.get("/dashboard", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM projects) AS total_projects,
            (SELECT COUNT(*) FROM deployments WHERE status = 'Success') AS successful_deployments,
            (SELECT COUNT(*) FROM deployments WHERE status = 'Failed') AS failed_deployments,
            (SELECT COUNT(*) FROM pipelines WHERE status = 'Running') AS active_pipelines
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load dashboard data"
            });
        }

        res.json(result[0]);
    });
});

app.listen(5000, () => {
    console.log("DevGuard server running on port 5000");
});