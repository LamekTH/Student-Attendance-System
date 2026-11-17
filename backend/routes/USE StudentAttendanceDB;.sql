USE StudentAttendanceDB;
GO

UPDATE dbo.Students
SET FirstName = 'Junias', LastName = 'Issaskar'
WHERE StudentNumber = 'STU001';

UPDATE dbo.Students
SET FirstName = 'Ashipala', LastName = 'Richard'
WHERE StudentNumber = 'STU002';

UPDATE dbo.Students
SET FirstName = 'Mutikisha', LastName = 'Phillipus'
WHERE StudentNumber = 'STU003';

UPDATE dbo.Students
SET FirstName = 'Mathias', LastName = 'Mwaetako'
WHERE StudentNumber = 'STU004';

UPDATE dbo.Students
SET FirstName = 'Mumbala', LastName = 'Stanley'
WHERE StudentNumber = 'STU005';
GO

SELECT StudentNumber, FirstName, LastName
FROM dbo.Students
WHERE StudentNumber IN (
    'STU001', 'STU002', 'STU003', 'STU004', 'STU005'
)
ORDER BY StudentNumber;
GO