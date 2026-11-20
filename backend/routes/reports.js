const express = require("express");
const router = express.Router();

const { sql, connectDB } = require("../db");

// ==========================================
// GENERATE ATTENDANCE REPORT
// ==========================================

router.get("/", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate required dates
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required."
            });
        }

        // Validate date format
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Dates must be in YYYY-MM-DD format."
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date."
            });
        }

        await connectDB();

        // REPORT SUMMARY
        const summaryResult = await sql.query`
            SELECT
                COUNT(*) AS TotalRecords,
                SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) AS Present,
                SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) AS Absent,
                SUM(CASE WHEN Status = 'Late' THEN 1 ELSE 0 END) AS Late,
                CAST(
                    100.0 * SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(*), 0)
                    AS DECIMAL(5,2)
                ) AS AttendancePercentage
            FROM Attendance
            WHERE AttendanceDate BETWEEN ${startDate} AND ${endDate};
        `;

        // DETAILED REPORT
        const recordsResult = await sql.query`
            SELECT
                a.AttendanceID,
                a.StudentID,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                s.Gender,
                c.ClassName,
                c.GradeLevel,
                a.AttendanceDate,
                a.Status
            FROM Attendance a
            INNER JOIN Students s
                ON a.StudentID = s.StudentID
            LEFT JOIN Classes c
                ON s.ClassID = c.ClassID
            WHERE a.AttendanceDate BETWEEN ${startDate} AND ${endDate}
            ORDER BY a.AttendanceDate DESC, s.LastName, s.FirstName;
        `;

        // STUDENT PERFORMANCE SUMMARY
        const studentResult = await sql.query`
            SELECT
                s.StudentID,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                c.ClassName,
                COUNT(a.AttendanceID) AS TotalDays,
                SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
                SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) AS Absent,
                SUM(CASE WHEN a.Status = 'Late' THEN 1 ELSE 0 END) AS Late,
                CAST(
                    100.0 * SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(a.AttendanceID), 0)
                    AS DECIMAL(5,2)
                ) AS AttendancePercentage
            FROM Students s
            LEFT JOIN Attendance a
                ON s.StudentID = a.StudentID
                AND a.AttendanceDate BETWEEN ${startDate} AND ${endDate}
            LEFT JOIN Classes c
                ON s.ClassID = c.ClassID
            GROUP BY
                s.StudentID,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                c.ClassName
            ORDER BY s.LastName, s.FirstName;
        `;

        res.json({
            success: true,
            startDate,
            endDate,
            summary: summaryResult.recordset[0],
            records: recordsResult.recordset,
            studentSummary: studentResult.recordset
        });

    } catch (error) {
        console.error("Report generation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate attendance report."
        });
    }
});
console.log("Reports file:", __filename);
console.log("Router type before export:", typeof router);

module.exports = router;

