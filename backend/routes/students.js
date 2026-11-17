
const express = require("express");
const router = express.Router();

const { sql, connectDB } = require("../db");

// ==========================================
// GET ALL STUDENTS
// ==========================================

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
        console.error("Get students error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve students."
        });
    }
});


// ==========================================
// GET AVAILABLE CLASSES
// ==========================================

router.get("/classes", async (req, res) => {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT ClassID, ClassName, GradeLevel
            FROM Classes
            ORDER BY GradeLevel, ClassName
        `);

        res.json({
            success: true,
            classes: result.recordset
        });

    } catch (error) {
        console.error("Get classes error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve classes."
        });
    }
});


// ==========================================
// ADD NEW STUDENT
// ==========================================

router.post("/", async (req, res) => {
    try {
        const {
            studentNumber,
            firstName,
            lastName,
            gender,
            classID
        } = req.body;

        if (
            !studentNumber?.trim() ||
            !firstName?.trim() ||
            !lastName?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Student number, first name and last name are required."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("StudentNumber", sql.VarChar(30), studentNumber.trim())
            .input("FirstName", sql.VarChar(50), firstName.trim())
            .input("LastName", sql.VarChar(50), lastName.trim())
            .input("Gender", sql.VarChar(10), gender || null)
            .input("ClassID", sql.Int, classID ? Number(classID) : null)
            .query(`
                INSERT INTO Students
                    (StudentNumber, FirstName, LastName, Gender, ClassID)
                OUTPUT INSERTED.*
                VALUES
                    (@StudentNumber, @FirstName, @LastName, @Gender, @ClassID)
            `);

        res.status(201).json({
            success: true,
            message: "Student registered successfully.",
            student: result.recordset[0]
        });

    } catch (error) {
        console.error("Add student error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                success: false,
                message: "This student number already exists."
            });
        }

        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                message: "The selected class does not exist."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to register student."
        });
    }
});


// ==========================================
// EDIT / UPDATE EXISTING STUDENT
// ==========================================

router.put("/:id", async (req, res) => {
    try {
        const studentID = Number(req.params.id);

        if (!Number.isInteger(studentID) || studentID <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const {
            studentNumber,
            firstName,
            lastName,
            gender,
            classID
        } = req.body;

        if (
            !studentNumber?.trim() ||
            !firstName?.trim() ||
            !lastName?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Student number, first name and last name are required."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("StudentID", sql.Int, studentID)
            .input("StudentNumber", sql.VarChar(30), studentNumber.trim())
            .input("FirstName", sql.VarChar(50), firstName.trim())
            .input("LastName", sql.VarChar(50), lastName.trim())
            .input("Gender", sql.VarChar(10), gender || null)
            .input("ClassID", sql.Int, classID ? Number(classID) : null)
            .query(`
                UPDATE Students
                SET
                    StudentNumber = @StudentNumber,
                    FirstName = @FirstName,
                    LastName = @LastName,
                    Gender = @Gender,
                    ClassID = @ClassID
                WHERE StudentID = @StudentID;

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
                WHERE s.StudentID = @StudentID;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        res.json({
            success: true,
            message: "Student updated successfully.",
            student: result.recordset[0]
        });

    } catch (error) {
        console.error("Update student error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                success: false,
                message: "That student number is already assigned to another student."
            });
        }

        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                message: "The selected class does not exist."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    }
});

module.exports = router;
