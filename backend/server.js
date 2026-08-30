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

app.listen(5000, "0.0.0.0", () => {
    console.log("DevGuard server running on port 5000");
});
app.get("/deployments", (req, res) => {
    const sql = "SELECT * FROM deployments ORDER BY id DESC";

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

app.get("/pipelines", (req, res) => {
    const sql = "SELECT * FROM pipelines ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.log("Failed to load pipelines:", err.message);

            return res.status(500).json({
                message: "Failed to load pipelines"
            });
        }

        res.json(results);
    });
});

app.get("/logs", (req, res) => {
    const sql = "SELECT * FROM logs ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.log("Failed to load logs:", err.message);

            return res.status(500).json({
                message: "Failed to load logs"
            });
        }

        res.json(results);
    });
});

app.post("/ai", (req, res) => {

    const question = (req.body.question || "").toLowerCase().trim();

    if (!question) {
        return res.status(400).json({
            message: "Question is required"
        });
    }

    const queries = {
        projects: "SELECT * FROM projects ORDER BY id DESC",
        deployments: "SELECT * FROM deployments ORDER BY id DESC",
        pipelines: "SELECT * FROM pipelines ORDER BY id DESC",
        logs: "SELECT * FROM logs ORDER BY id DESC"
    };

    db.query(queries.projects, (err, projects) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to read projects"
            });
        }

        db.query(queries.deployments, (err, deployments) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to read deployments"
                });
            }

            db.query(queries.pipelines, (err, pipelines) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to read pipelines"
                    });
                }

                db.query(queries.logs, (err, logs) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to read logs"
                        });
                    }


                    let answer = "";


                    if (
                        question.includes("project") ||
                        question.includes("projects")
                    ) {

                        if (projects.length === 0) {

                            answer = "There are no projects in DevGuard.";

                        } else {

                            answer =
                                `DevGuard currently has ${projects.length} project(s). ` +
                                projects.map(p =>
                                    `Project #${p.id} is "${p.name}" and its status is ${p.status}.`
                                ).join(" ");

                        }

                    }


                    else if (
                        question.includes("deployment") ||
                        question.includes("deployments")
                    ) {

                        if (deployments.length === 0) {

                            answer = "There are no deployments yet.";

                        } else {

                            const successful =
                                deployments.filter(
                                    d => d.status === "Success"
                                ).length;

                            const failed =
                                deployments.filter(
                                    d => d.status === "Failed"
                                ).length;

                            answer =
                                `There are ${deployments.length} deployment(s). ` +
                                `${successful} successful and ${failed} failed.`;

                            const latest = deployments[0];

                            answer +=
                                ` The latest deployment is ${latest.status}, version ${latest.version}.`;
                        }

                    }


                    else if (
                        question.includes("pipeline") ||
                        question.includes("pipelines")
                    ) {

                        if (pipelines.length === 0) {

                            answer = "There are no pipelines available.";

                        } else {

                            const active =
                                pipelines.filter(
                                    p => p.status === "Active"
                                ).length;

                            answer =
                                `DevGuard has ${pipelines.length} pipeline(s). ` +
                                `${active} pipeline(s) are currently active.`;

                        }

                    }


                    else if (
                        question.includes("log") ||
                        question.includes("logs")
                    ) {

                        if (logs.length === 0) {

                            answer = "There are no logs available.";

                        } else {

                            answer =
                                `There are ${logs.length} log entries. ` +
                                `The latest log says: "${logs[0].message}"`;

                        }

                    }


                    else if (
                        question.includes("status") ||
                        question.includes("health") ||
                        question.includes("overview")
                    ) {

                        const successful =
                            deployments.filter(
                                d => d.status === "Success"
                            ).length;

                        const failed =
                            deployments.filter(
                                d => d.status === "Failed"
                            ).length;

                        const active =
                            pipelines.filter(
                                p => p.status === "Active"
                            ).length;

                        answer =
                            `DevGuard overview: ${projects.length} project(s), ` +
                            `${successful} successful deployment(s), ` +
                            `${failed} failed deployment(s), and ` +
                            `${active} active pipeline(s).`;

                    }


                    else if (
                        question.includes("failed")
                    ) {

                        const failed =
                            deployments.filter(
                                d => d.status === "Failed"
                            );

                        if (failed.length === 0) {

                            answer =
                                "Good news. There are no failed deployments.";

                        } else {

                            answer =
                                `There are ${failed.length} failed deployment(s).`;

                        }

                    }


                    else if (
                        question.includes("success") ||
                        question.includes("successful")
                    ) {

                        const successful =
                            deployments.filter(
                                d => d.status === "Success"
                            );

                        answer =
                            `There are ${successful.length} successful deployment(s).`;

                    }


                    else {

                        answer =
                            "I can help with Projects, Deployments, Pipelines, Logs, and DevGuard system status. Try asking: 'What is my deployment status?'";

                    }


                    res.json({
                        answer: answer
                    });

                });

            });

        });

    });

});
