
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. GET HTML ELEMENTS
    // ==========================================

    const currentDate = document.getElementById("currentDate");
    const attendanceDate = document.getElementById("attendanceDate");

    const searchInput = document.getElementById("searchInput");
    const attendanceSearch = document.getElementById("attendanceSearch");

    const registeredTable = document.getElementById("attendanceTable");
    const attendanceRecords = document.getElementById("attendanceRecords");

    const noResults = document.getElementById("noResults");

    const totalStudents = document.getElementById("totalStudents");

    const presentToday = document.getElementById("presentToday");
    const absentToday = document.getElementById("absentToday");
    const lateToday = document.getElementById("lateToday");

    const presentPercentage = document.getElementById("presentPercentage");
    const absentPercentage = document.getElementById("absentPercentage");
    const latePercentage = document.getElementById("latePercentage");

    const attendanceDonut = document.getElementById("attendanceDonut");
    const attendanceRate = document.getElementById("attendanceRate");

    const presentCount = document.getElementById("presentCount");
    const absentCount = document.getElementById("absentCount");
    const lateCount = document.getElementById("lateCount");

    const saveAttendanceButton = document.getElementById("saveAttendance");
    const attendanceMessage = document.getElementById("attendanceMessage");

    // ==========================================
    // 2. DATE FUNCTIONS
    // ==========================================

    const today = new Date();

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (currentDate) {
        currentDate.textContent = today.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    if (attendanceDate) {
        attendanceDate.textContent = today.toLocaleDateString("en-GB");
    }

    // ==========================================
    // 3. STORE DATA
    // ==========================================

    let students = [];
    let attendanceStatus = {};

    // ==========================================
    // 4. ESCAPE DATABASE VALUES
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // ==========================================
    // 5. DISPLAY REGISTERED STUDENTS
    // ==========================================

    function displayStudents(studentList) {

        if (!registeredTable) return;

        registeredTable.innerHTML = "";

        studentList.forEach(student => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}</td>
                <td>${escapeHTML(student.StudentNumber)}</td>
                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>
                <td>${escapeHTML(student.Gender || "Not specified")}</td>
            `;

            registeredTable.appendChild(row);
        });

        if (noResults) {
            noResults.hidden = studentList.length !== 0;
        }
    }

    // ==========================================
    // 6. DISPLAY STUDENTS IN ATTENDANCE TABLE
    // ==========================================

    function displayAttendanceStudents(studentList) {

        if (!attendanceRecords) return;

        attendanceRecords.innerHTML = "";

        if (studentList.length === 0) {
            attendanceRecords.innerHTML = `
                <tr>
                    <td colspan="4">No students found.</td>
                </tr>
            `;
            return;
        }

        studentList.forEach(student => {

            const row = document.createElement("tr");

            const savedStatus = attendanceStatus[student.StudentID] || "";

            row.innerHTML = `
                <td>${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}</td>

                <td>${escapeHTML(student.StudentNumber)}</td>

                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>

                <td>
                    <select
                        class="attendance-status"
                        data-student-id="${escapeHTML(student.StudentID)}"
                    >
                        <option value="" ${savedStatus === "" ? "selected" : ""}>
                            Select status
                        </option>

                        <option value="Present" ${savedStatus === "Present" ? "selected" : ""}>
                            Present
                        </option>

                        <option value="Absent" ${savedStatus === "Absent" ? "selected" : ""}>
                            Absent
                        </option>

                        <option value="Late" ${savedStatus === "Late" ? "selected" : ""}>
                            Late
                        </option>
                    </select>
                </td>
            `;

            attendanceRecords.appendChild(row);
        });
    }

    // ==========================================
    // 7. LOAD EXISTING ATTENDANCE FOR TODAY
    // ==========================================

    async function loadTodayAttendance() {

        try {

            const response = await fetch(
                "http://localhost:5000/api/attendance/today"
            );

            if (!response.ok) {
                throw new Error("Could not load today's attendance.");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Attendance loading failed.");
            }

            attendanceStatus = {};

            data.attendance.forEach(record => {
                attendanceStatus[record.StudentID] = record.Status;
            });

            console.log("Today's attendance loaded:", attendanceStatus);

        } catch (error) {

            console.error("Today's attendance error:", error);

            attendanceStatus = {};
        }
    }

    // ==========================================
    // 8. LOAD STUDENTS FROM DATABASE
    // ==========================================

    async function loadStudents() {

        try {

            if (registeredTable) {
                registeredTable.innerHTML = `
                    <tr>
                        <td colspan="4">Loading students...</td>
                    </tr>
                `;
            }

            if (attendanceRecords) {
                attendanceRecords.innerHTML = `
                    <tr>
                        <td colspan="4">Loading students...</td>
                    </tr>
                `;
            }

            const response = await fetch(
                "http://localhost:5000/api/students"
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve students.");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Unable to load students.");
            }

            students = data.students || [];

            if (totalStudents) {
                totalStudents.textContent = students.length;
            }

            await loadTodayAttendance();

            displayStudents(students);
            displayAttendanceStudents(students);

            console.log("Students loaded successfully:", students);

        } catch (error) {

            console.error("Student loading error:", error);

            const errorMessage = `
                <tr>
                    <td colspan="4">
                        Unable to load students. Check the backend and API.
                    </td>
                </tr>
            `;

            if (registeredTable) {
                registeredTable.innerHTML = errorMessage;
            }

            if (attendanceRecords) {
                attendanceRecords.innerHTML = errorMessage;
            }
        }
    }

    // ==========================================
    // 9. LOAD DASHBOARD ATTENDANCE SUMMARY
    // ==========================================

    async function loadAttendanceSummary() {

        try {

            const response = await fetch(
                "http://localhost:5000/api/attendance/summary"
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve attendance summary.");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Unable to load attendance.");
            }

            const summary = data.summary;

            const present = Number(summary.Present) || 0;
            const absent = Number(summary.Absent) || 0;
            const late = Number(summary.Late) || 0;
            const total = Number(summary.TotalRecords) || 0;

            const presentRate = total > 0 ? (present / total) * 100 : 0;
            const absentRate = total > 0 ? (absent / total) * 100 : 0;
            const lateRate = total > 0 ? (late / total) * 100 : 0;

            if (presentToday) presentToday.textContent = present;
            if (absentToday) absentToday.textContent = absent;
            if (lateToday) lateToday.textContent = late;

            if (presentPercentage) {
                presentPercentage.textContent = `${presentRate.toFixed(1)}% attendance`;
            }

            if (absentPercentage) {
                absentPercentage.textContent = `${absentRate.toFixed(1)}% of records`;
            }

            if (latePercentage) {
                latePercentage.textContent = `${lateRate.toFixed(1)}% of records`;
            }

            if (attendanceRate) {
                attendanceRate.textContent = `${presentRate.toFixed(1)}%`;
            }

            if (presentCount) presentCount.textContent = present;
            if (absentCount) absentCount.textContent = absent;
            if (lateCount) lateCount.textContent = late;

            if (attendanceDonut) {

                const presentDegrees = presentRate * 3.6;
                const absentDegrees = presentDegrees + (absentRate * 3.6);

                attendanceDonut.style.background = `
                    conic-gradient(
                        #2563eb 0deg ${presentDegrees}deg,
                        #ef4444 ${presentDegrees}deg ${absentDegrees}deg,
                        #f59e0b ${absentDegrees}deg 360deg
                    )
                `;
            }

            console.log("Attendance summary loaded:", summary);

        } catch (error) {

            console.error("Attendance summary error:", error);
        }
    }

    // ==========================================
    // 10. SEARCH REGISTERED STUDENTS
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            const searchValue = this.value.toLowerCase().trim();

            const filteredStudents = students.filter(student => {

                const details = `
                    ${student.FirstName}
                    ${student.LastName}
                    ${student.StudentNumber}
                    ${student.ClassName}
                `.toLowerCase();

                return details.includes(searchValue);
            });

            displayStudents(filteredStudents);
        });
    }

    // ==========================================
    // 11. SEARCH ATTENDANCE STUDENTS
    // ==========================================

    if (attendanceSearch) {

        attendanceSearch.addEventListener("input", function () {

            const searchValue = this.value.toLowerCase().trim();

            const filteredStudents = students.filter(student => {

                const details = `
                    ${student.FirstName}
                    ${student.LastName}
                    ${student.StudentNumber}
                    ${student.ClassName}
                `.toLowerCase();

                return details.includes(searchValue);
            });

            displayAttendanceStudents(filteredStudents);
        });
    }

    // ==========================================
    // 12. SAVE ATTENDANCE TO DATABASE
    // ==========================================

    if (saveAttendanceButton) {

        saveAttendanceButton.addEventListener("click", async function () {

            const statusSelects = document.querySelectorAll(
                "#attendanceRecords .attendance-status"
            );

            if (students.length === 0) {
                attendanceMessage.textContent = "No students available.";
                return;
            }

            const records = [];

            for (const student of students) {

                const select = Array.from(statusSelects).find(
                    element => Number(element.dataset.studentId) === student.StudentID
                );

                const status = select ? select.value : attendanceStatus[student.StudentID] || "";

                if (!status) {

                    if (attendanceMessage) {
                        attendanceMessage.textContent =
                            `Please select an attendance status for ${student.FirstName} ${student.LastName}.`;
                    }

                    return;
                }

                records.push({
                    studentID: student.StudentID,
                    status: status
                });
            }

            try {

                saveAttendanceButton.disabled = true;
                saveAttendanceButton.textContent = "Saving...";

                if (attendanceMessage) {
                    attendanceMessage.textContent = "Saving attendance...";
                }

                const response = await fetch(
                    "http://localhost:5000/api/attendance",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            attendanceDate: todayString,
                            records: records
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to save attendance.");
                }

                attendanceMessage.textContent = data.message;

                await loadAttendanceSummary();

                await loadTodayAttendance();

                displayAttendanceStudents(students);

            } catch (error) {

                console.error("Save attendance error:", error);

                if (attendanceMessage) {
                    attendanceMessage.textContent = error.message;
                }

            } finally {

                saveAttendanceButton.disabled = false;
                saveAttendanceButton.textContent = "Save Attendance";
            }
        });
    }

    // ==========================================
    // 13. START THE DASHBOARD
    // ==========================================

    loadStudents();
    loadAttendanceSummary();

});
