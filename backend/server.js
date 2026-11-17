
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const studentsRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require("path");

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend server is working correctly"
    });
});

// API routes
app.use("/api/students", studentsRoutes);
app.use("/api/attendance", attendanceRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
