
IF DB_ID('StudentAttendanceDB') IS NULL
BEGIN
    CREATE DATABASE StudentAttendanceDB;
    PRINT 'StudentAttendanceDB created successfully.';
END
ELSE
BEGIN
    PRINT 'StudentAttendanceDB already exists.';
END;


SELECT name
FROM sys.databases
WHERE name = 'StudentAttendanceDB';
