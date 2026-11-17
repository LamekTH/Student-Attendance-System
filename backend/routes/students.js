
const express = require("express");
const router = express.Router();

const { sql, connectDB } = require("../db");

// GET: Retrieve all students
router.get("/", async (req, res) => {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                s.StudentID,
                s.StudentNumber,
                s.FirstName,
                s.LastName,
                s.Gender,
                s.ClassID,
                c.ClassName,
                c.GradeLevel
            FROM Students s
            LEFT JOIN Classes c
                ON s.ClassID = c.ClassID
            ORDER BY s.StudentID DESC
        `);

        res.json({
            success: true,
            students: result.recordset
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
});

// POST: Register a new student
router.post("/", async (req, res) => {
    try {
        const {
            studentNumber,
            firstName,
            lastName,
            gender,
            classID
        } = req.body;

        if (!studentNumber || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: "Student number, first name and last name are required"
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("StudentNumber", sql.VarChar(30), studentNumber)
            .input("FirstName", sql.VarChar(50), firstName)
            .input("LastName", sql.VarChar(50), lastName)
            .input("Gender", sql.VarChar(10), gender || null)
            .input("ClassID", sql.Int, classID || null)
            .query(`
                INSERT INTO Students
                    (StudentNumber, FirstName, LastName, Gender, ClassID)
                OUTPUT INSERTED.*
                VALUES
                    (@StudentNumber, @FirstName, @LastName, @Gender, @ClassID)
            `);

        res.status(201).json({
            success: true,
            message: "Student registered successfully",
            student: result.recordset[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to register student"
        });
    }
});

module.exports = router;
