
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Student Attendance Management System API",
        status: "Running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend server is working correctly"
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
