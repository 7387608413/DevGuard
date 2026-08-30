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
    const sql = "SELECT * FROM projects ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.log("Failed to load projects:", err.message);

            return res.status(500).json({
                message: "Failed to load projects"
            });
        }

        res.json(results);
    });
});

app.post("/projects", (req, res) => {
    const { name, github_url } = req.body;

    if (!name || !github_url) {
        return res.status(400).json({
            message: "Name and GitHub URL are required"
        });
    }

    const sql = `
        INSERT INTO projects (name, github_url)
        VALUES (?, ?)
    `;

    db.query(sql, [name, github_url], (err, result) => {
        if (err) {
            console.log("Failed to add project:", err.message);

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

app.get("/dashboard", (req, res) => {

    const queries = {
        total_projects: "SELECT COUNT(*) AS count FROM projects",
        successful_deployments:
            "SELECT COUNT(*) AS count FROM deployments WHERE status = 'Success'",
        failed_deployments:
            "SELECT COUNT(*) AS count FROM deployments WHERE status = 'Failed'",
        active_pipelines:
            "SELECT COUNT(*) AS count FROM pipelines WHERE status = 'Active'"
    };

    db.query(queries.total_projects, (err, projects) => {
        if (err) return res.status(500).json({ message: "Dashboard error" });

        db.query(queries.successful_deployments, (err, success) => {
            if (err) return res.status(500).json({ message: "Dashboard error" });

            db.query(queries.failed_deployments, (err, failed) => {
                if (err) return res.status(500).json({ message: "Dashboard error" });

                db.query(queries.active_pipelines, (err, pipelines) => {
                    if (err) return res.status(500).json({ message: "Dashboard error" });

                    res.json({
                        total_projects: projects[0].count,
                        successful_deployments: success[0].count,
                        failed_deployments: failed[0].count,
                        active_pipelines: pipelines[0].count
                    });
                });
            });
        });
    });
});
app.get("/deployments", (req, res) => {
    const sql = `
        SELECT *
        FROM deployments
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log("Failed to load deployments:", err.message);

            return res.status(500).json({
                message: "Failed to load deployments"
            });
        }

        res.json(results);
    });
});
app.listen(5000, "0.0.0.0", () => {
    console.log("DevGuard server running on port 5000");
});