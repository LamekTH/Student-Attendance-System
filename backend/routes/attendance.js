
const express = require("express");
const router = express.Router();

const { sql, connectDB } = require("../db");

// ==========================================
// GET TODAY'S ATTENDANCE SUMMARY
// ==========================================

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
            message: "Unable to retrieve attendance summary."
        });
    }
});


// ==========================================
// SAVE ATTENDANCE RECORDS
// ==========================================

router.post("/", async (req, res) => {
    const { attendanceDate, records } = req.body;

    if (!attendanceDate || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Attendance date and records are required."
        });
    }

    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(attendanceDate);

    if (!validDate) {
        return res.status(400).json({
            success: false,
            message: "Invalid attendance date."
        });
    }

    const validStatuses = ["Present", "Absent", "Late"];

    for (const record of records) {
        if (
            !Number.isInteger(Number(record.studentID)) ||
            !validStatuses.includes(record.status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID or attendance status."
            });
        }
    }

    try {
        await connectDB();

        const transaction = new sql.Transaction();

        await transaction.begin();

        try {
            for (const record of records) {
                const request = new sql.Request(transaction);

                request.input("StudentID", sql.Int, Number(record.studentID));
                request.input("AttendanceDate", sql.Date, attendanceDate);
                request.input("Status", sql.VarChar(10), record.status);

                await request.query(`
                    IF EXISTS (
                        SELECT 1
                        FROM Attendance
                        WHERE StudentID = @StudentID
                        AND AttendanceDate = @AttendanceDate
                    )
                    BEGIN
                        UPDATE Attendance
                        SET Status = @Status
                        WHERE StudentID = @StudentID
                        AND AttendanceDate = @AttendanceDate;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO Attendance
                            (StudentID, AttendanceDate, Status)
                        VALUES
                            (@StudentID, @AttendanceDate, @Status);
                    END
                `);
            }

            await transaction.commit();

            res.json({
                success: true,
                message: "Attendance saved successfully.",
                recordsSaved: records.length
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error("Save attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save attendance.",
            error: error.message
        });
    }
});

module.exports = router;
