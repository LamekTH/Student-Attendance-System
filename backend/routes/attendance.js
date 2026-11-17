
const express = require("express");
const router = express.Router();

const { sql, connectDB } = require("../db");

// GET today's attendance summary
router.get("/summary", async (req, res) => {
    try {
        await connectDB();

        const result = await sql.query(`
            SELECT
                COUNT(*) AS TotalRecords,
                SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) AS Present,
                SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) AS Absent,
                SUM(CASE WHEN Status = 'Late' THEN 1 ELSE 0 END) AS Late
            FROM Attendance
            WHERE AttendanceDate = CAST(GETDATE() AS DATE);
        `);

        const summary = result.recordset[0];

        res.json({
            success: true,
            summary: {
                TotalRecords: summary.TotalRecords,
                Present: summary.Present || 0,
                Absent: summary.Absent || 0,
                Late: summary.Late || 0
            }
        });

    } catch (error) {
        console.error("Attendance summary error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve attendance summary.",
            error: error.message
        });
    }
});

module.exports = router;
