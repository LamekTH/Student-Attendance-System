
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:5000/api";

    // DOM ELEMENTS
    const currentDate = document.getElementById("currentDate");
    const attendanceDate = document.getElementById("attendanceDate");

    const attendanceRecords = document.getElementById("attendanceRecords");
    const attendanceTable = document.getElementById("attendanceTable");

    const attendanceSearch = document.getElementById("attendanceSearch");
    const searchInput = document.getElementById("searchInput");

    const saveAttendance = document.getElementById("saveAttendance");
    const attendanceMessage = document.getElementById("attendanceMessage");

    const studentForm = document.getElementById("studentForm");
    const studentFormContainer = document.getElementById("studentFormContainer");
    const studentFormTitle = document.getElementById("studentFormTitle");
    const studentFormMessage = document.getElementById("studentFormMessage");

    const showAddStudent = document.getElementById("showAddStudent");
    const cancelStudentForm = document.getElementById("cancelStudentForm");

    const editStudentID = document.getElementById("editStudentID");
    const studentNumber = document.getElementById("studentNumber");
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const gender = document.getElementById("gender");
    const classID = document.getElementById("classID");
    const submitStudent = document.getElementById("submitStudent");

    const noResults = document.getElementById("noResults");

    // APPLICATION DATA
    let students = [];
    let classes = [];
    let attendanceStatus = {};

    // DISPLAY TODAY'S DATE
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    if (currentDate) currentDate.textContent = formattedDate;

    const todayISO = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (attendanceDate) {
        attendanceDate.textContent = formattedDate;
    }

    // ESCAPE HTML
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // LOAD ALL STUDENTS
    async function loadStudents() {
        try {
            const response = await fetch(`${API_URL}/students`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load students.");
            }

            students = data.students || [];

            displayStudents();
            displayAttendanceStudents();

            const totalStudents = document.getElementById("totalStudents");

            if (totalStudents) {
                totalStudents.textContent = students.length;
            }

        } catch (error) {
            console.error("Load students error:", error);

            if (attendanceTable) {
                attendanceTable.innerHTML = `
                    <tr><td colspan="5">Unable to load students.</td></tr>
                `;
            }

            if (attendanceRecords) {
                attendanceRecords.innerHTML = `
                    <tr><td colspan="4">Unable to load students.</td></tr>
                `;
            }
        }
    }

    // DISPLAY REGISTERED STUDENTS
    function displayStudents(list = students) {
        if (!attendanceTable) return;

        if (list.length === 0) {
            attendanceTable.innerHTML = `
                <tr><td colspan="5">No students registered.</td></tr>
            `;

            if (noResults) noResults.hidden = students.length === 0;
            return;
        }

        if (noResults) noResults.hidden = true;

        attendanceTable.innerHTML = list.map(student => `
            <tr>
                <td>
                    <strong>${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}</strong>
                </td>
                <td>${escapeHTML(student.StudentNumber)}</td>
                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>
                <td>${escapeHTML(student.Gender || "Not specified")}</td>
                <td>
                    <button
                        type="button"
                        class="edit-student-btn"
                        data-id="${student.StudentID}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-student-btn"
                        data-id="${student.StudentID}"
                        style="
                            background: rgba(255, 100, 100, 0.15);
                            color: #ffaaaa;
                            border: 1px solid rgba(255, 120, 120, 0.25);
                            padding: 9px 12px;
                            border-radius: 8px;
                            font-size: 11px;
                            font-weight: 700;
                            cursor: pointer;
                            margin-left: 5px;
                        ">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // LOAD CLASSES
    async function loadClasses() {
        try {
            const response = await fetch(`${API_URL}/students/classes`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load classes.");
            }

            classes = data.classes || [];

            if (classID) {
                classID.innerHTML = `
                    <option value="">Select class</option>
                    ${classes.map(item => `
                        <option value="${item.ClassID}">
                            ${escapeHTML(item.ClassName)} - ${escapeHTML(item.GradeLevel)}
                        </option>
                    `).join("")}
                `;
            }

        } catch (error) {
            console.error("Load classes error:", error);

            if (studentFormMessage) {
                studentFormMessage.textContent =
                    "Could not load classes. Please check the server.";
            }
        }
    }

    // LOAD TODAY'S ATTENDANCE
    async function loadTodayAttendance() {
        try {
            const response = await fetch(`${API_URL}/attendance/today`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load attendance.");
            }

            attendanceStatus = {};

            (data.attendance || []).forEach(record => {
                attendanceStatus[record.StudentID] = record.Status;
            });

            displayAttendanceStudents();

        } catch (error) {
            console.error("Load attendance error:", error);
        }
    }

    // DISPLAY ATTENDANCE TABLE
    function displayAttendanceStudents(list = students) {
        if (!attendanceRecords) return;

        if (list.length === 0) {
            attendanceRecords.innerHTML = `
                <tr><td colspan="4">No students found.</td></tr>
            `;
            return;
        }

        attendanceRecords.innerHTML = list.map(student => `
            <tr>
                <td>
                    ${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}
                </td>
                <td>${escapeHTML(student.StudentNumber)}</td>
                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>
                <td>
                    <select
                        class="attendance-status"
                        data-id="${student.StudentID}">
                        <option value="">Select status</option>
                        <option value="Present" ${attendanceStatus[student.StudentID] === "Present" ? "selected" : ""}>Present</option>
                        <option value="Absent" ${attendanceStatus[student.StudentID] === "Absent" ? "selected" : ""}>Absent</option>
                        <option value="Late" ${attendanceStatus[student.StudentID] === "Late" ? "selected" : ""}>Late</option>
                    </select>
                </td>
            </tr>
        `).join("");
    }

    // TRACK ATTENDANCE SELECTIONS
    if (attendanceRecords) {
        attendanceRecords.addEventListener("change", event => {
            if (event.target.classList.contains("attendance-status")) {
                const id = event.target.dataset.id;
                attendanceStatus[id] = event.target.value;
            }
        });
    }

    // ATTENDANCE SEARCH
    if (attendanceSearch) {
        attendanceSearch.addEventListener("input", () => {
            const search = attendanceSearch.value.toLowerCase();

            const filtered = students.filter(student =>
                `${student.FirstName} ${student.LastName} ${student.StudentNumber} ${student.ClassName || ""}`
                    .toLowerCase()
                    .includes(search)
            );

            displayAttendanceStudents(filtered);
        });
    }

    // STUDENT SEARCH
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const search = searchInput.value.toLowerCase();

            const filtered = students.filter(student =>
                `${student.FirstName} ${student.LastName} ${student.StudentNumber} ${student.ClassName || ""}`
                    .toLowerCase()
                    .includes(search)
            );

            displayStudents(filtered);
        });
    }

    // LOAD ATTENDANCE SUMMARY
    async function loadAttendanceSummary() {
        try {
            const response = await fetch(`${API_URL}/attendance/summary`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load summary.");
            }

            const summary = data.summary || data;

            const present = Number(summary.Present || summary.present || 0);
            const absent = Number(summary.Absent || summary.absent || 0);
            const late = Number(summary.Late || summary.late || 0);
            const total = present + absent + late;

            const percentage = total ? Math.round((present / total) * 100) : 0;

            document.getElementById("presentToday").textContent = present;
            document.getElementById("absentToday").textContent = absent;
            document.getElementById("lateToday").textContent = late;

            document.getElementById("presentCount").textContent = present;
            document.getElementById("absentCount").textContent = absent;
            document.getElementById("lateCount").textContent = late;

            document.getElementById("attendanceRate").textContent = `${percentage}%`;

            document.getElementById("presentPercentage").textContent =
                `${percentage}% attendance`;

            document.getElementById("absentPercentage").textContent =
                `${total ? Math.round(absent / total * 100) : 0}% of records`;

            document.getElementById("latePercentage").textContent =
                `${total ? Math.round(late / total * 100) : 0}% of records`;

            const donut = document.getElementById("attendanceDonut");

            if (donut) {
                const presentAngle = total ? present / total * 360 : 0;
                const absentAngle = total ? absent / total * 360 : 0;

                donut.style.background = `
                    conic-gradient(
                        #b9e6a5 0deg ${presentAngle}deg,
                        #e67c7c ${presentAngle}deg ${presentAngle + absentAngle}deg,
                        #e8b76e ${presentAngle + absentAngle}deg 360deg
                    )
                `;
            }

        } catch (error) {
            console.error("Attendance summary error:", error);
        }
    }

    // SAVE ATTENDANCE
    if (saveAttendance) {
        saveAttendance.addEventListener("click", async () => {

            if (students.length === 0) {
                attendanceMessage.textContent = "No students available.";
                return;
            }

            const records = students.map(student => ({
                studentID: student.StudentID,
                status: attendanceStatus[student.StudentID] || ""
            }));

            const incomplete = records.some(record => !record.status);

            if (incomplete) {
                attendanceMessage.textContent =
                    "Please select an attendance status for every student.";
                attendanceMessage.style.color = "#dc2626";
                return;
            }

            try {
                saveAttendance.disabled = true;
                saveAttendance.textContent = "Saving...";

                const response = await fetch(`${API_URL}/attendance`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        attendanceDate: todayISO,
                        records
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Failed to save attendance.");
                }

                attendanceMessage.textContent =
                    data.message || "Attendance saved successfully.";

                attendanceMessage.style.color = "#16a34a";

                await loadTodayAttendance();
                await loadAttendanceSummary();

            } catch (error) {
                console.error("Save attendance error:", error);

                attendanceMessage.textContent = error.message;
                attendanceMessage.style.color = "#dc2626";

            } finally {
                saveAttendance.disabled = false;
                saveAttendance.textContent = "Save Attendance";
            }
        });
    }

    // OPEN ADD STUDENT FORM
    if (showAddStudent) {
        showAddStudent.addEventListener("click", () => {
            studentForm.reset();
            editStudentID.value = "";

            studentFormTitle.textContent = "Register New Student";
            submitStudent.textContent = "Save Student";
            studentFormMessage.textContent = "";

            studentFormContainer.hidden = false;
        });
    }

    // EDIT AND DELETE STUDENT
    if (attendanceTable) {
        attendanceTable.addEventListener("click", async event => {

            // EDIT STUDENT
            const editButton = event.target.closest(".edit-student-btn");

            if (editButton) {
                const id = Number(editButton.dataset.id);
                const student = students.find(item => item.StudentID === id);

                if (!student) return;

                studentForm.reset();

                editStudentID.value = student.StudentID;
                studentNumber.value = student.StudentNumber;
                firstName.value = student.FirstName;
                lastName.value = student.LastName;
                gender.value = student.Gender || "";
                classID.value = student.ClassID || "";

                studentFormTitle.textContent = "Edit Student";
                submitStudent.textContent = "Update Student";
                studentFormMessage.textContent = "";

                studentFormContainer.hidden = false;

                studentFormContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                return;
            }

            // DELETE STUDENT
            const deleteButton = event.target.closest(".delete-student-btn");

            if (deleteButton) {
                const id = Number(deleteButton.dataset.id);

                const student = students.find(item => item.StudentID === id);

                if (!student) return;

                const studentName =
                    `${student.FirstName} ${student.LastName}`;

                const confirmed = window.confirm(
                    `Are you sure you want to delete ${studentName} (${student.StudentNumber})?\n\nThis will permanently delete the student and all their attendance records.`
                );

                if (!confirmed) return;

                try {
                    deleteButton.disabled = true;
                    deleteButton.textContent = "Deleting...";

                    const response = await fetch(
                        `${API_URL}/students/${id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.message || "Failed to delete student.");
                    }

                    delete attendanceStatus[id];

                    await loadStudents();
                    await loadTodayAttendance();
                    await loadAttendanceSummary();

                    if (searchInput) {
                        searchInput.dispatchEvent(new Event("input"));
                    }

                    if (attendanceMessage) {
                        attendanceMessage.textContent =
                            `${studentName} was deleted successfully.`;
                        attendanceMessage.style.color = "#16a34a";
                    }

                } catch (error) {
                    console.error("Delete student error:", error);

                    window.alert(error.message);

                    deleteButton.disabled = false;
                    deleteButton.textContent = "Delete";
                }
            }
        });
    }

    // CANCEL STUDENT FORM
    if (cancelStudentForm) {
        cancelStudentForm.addEventListener("click", () => {
            studentForm.reset();
            editStudentID.value = "";
            studentFormContainer.hidden = true;
            studentFormMessage.textContent = "";
        });
    }

    // ADD OR UPDATE STUDENT
    if (studentForm) {
        studentForm.addEventListener("submit", async event => {
            event.preventDefault();

            const id = editStudentID.value;

            const studentData = {
                studentNumber: studentNumber.value.trim(),
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                gender: gender.value,
                classID: classID.value || null
            };

            try {
                submitStudent.disabled = true;
                submitStudent.textContent = id ? "Updating..." : "Saving...";

                const response = await fetch(
                    id
                        ? `${API_URL}/students/${id}`
                        : `${API_URL}/students`,
                    {
                        method: id ? "PUT" : "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(studentData)
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Could not save student.");
                }

                studentFormMessage.textContent = data.message;
                studentFormMessage.style.color = "#16a34a";

                await loadStudents();
                await loadTodayAttendance();
                await loadAttendanceSummary();

                studentForm.reset();
                editStudentID.value = "";
                studentFormContainer.hidden = true;

            } catch (error) {
                console.error("Save student error:", error);

                studentFormMessage.textContent = error.message;
                studentFormMessage.style.color = "#dc2626";

            } finally {
                submitStudent.disabled = false;
                submitStudent.textContent = editStudentID.value
                    ? "Update Student"
                    : "Save Student";
            }
        });
    }

    // ==========================================
    // ATTENDANCE REPORT FUNCTIONALITY
    // ==========================================

    const reportForm = document.getElementById("reportForm");
    const reportStartDate = document.getElementById("reportStartDate");
    const reportEndDate = document.getElementById("reportEndDate");
    const reportMessage = document.getElementById("reportMessage");
    const reportOutput = document.getElementById("reportOutput");
    const printReport = document.getElementById("printReport");

    // SET DEFAULT REPORT DATES
    if (reportStartDate && reportEndDate) {
        const monthStart = new Date();
        monthStart.setDate(1);

        reportStartDate.value = [
            monthStart.getFullYear(),
            String(monthStart.getMonth() + 1).padStart(2, "0"),
            "01"
        ].join("-");

        reportEndDate.value = todayISO;
    }

    // FORMAT REPORT DATE
    function formatReportDate(value) {
        if (!value) return "—";

        const date = String(value).slice(0, 10);
        const parts = date.split("-");

        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        return date;
    }

    // GENERATE ATTENDANCE REPORT
    if (reportForm) {
        reportForm.addEventListener("submit", async event => {
            event.preventDefault();

            const startDate = reportStartDate?.value;
            const endDate = reportEndDate?.value;

            if (!startDate || !endDate) {
                reportMessage.textContent =
                    "Please select both report dates.";
                return;
            }

            if (startDate > endDate) {
                reportMessage.textContent =
                    "Start date cannot be after end date.";
                return;
            }

            try {
                reportMessage.textContent = "Generating report...";

                if (printReport) {
                    printReport.disabled = true;
                }

                const response = await fetch(
                    `${API_URL}/reports?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Could not generate report."
                    );
                }

                // REPORT SUMMARY
                const summary = data.summary || {};

                const total = Number(summary.TotalRecords || 0);
                const present = Number(summary.Present || 0);
                const absent = Number(summary.Absent || 0);
                const late = Number(summary.Late || 0);

                const percentage = Number(
                    summary.AttendancePercentage || 0
                );

                const setReportValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = value;
                };

                setReportValue("reportTotalRecords", total);
                setReportValue("reportPresent", present);
                setReportValue("reportAbsent", absent);
                setReportValue("reportLate", late);

                setReportValue(
                    "reportAttendancePercentage",
                    `${percentage.toFixed(2)}%`
                );

                // REPORT DATE RANGE
                setReportValue(
                    "reportDateRange",
                    `${formatReportDate(startDate)} - ${formatReportDate(endDate)}`
                );

                setReportValue(
                    "reportGeneratedAt",
                    new Date().toLocaleString("en-GB")
                );

                // STUDENT SUMMARY
                const studentTable =
                    document.getElementById("reportStudentSummary");

                const studentSummary = data.studentSummary || [];

                if (studentTable) {
                    studentTable.innerHTML = studentSummary.length
                        ? studentSummary.map(student => `
                            <tr>
                                <td>${escapeHTML(student.StudentNumber)}</td>
                                <td>${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}</td>
                                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>
                                <td>${Number(student.TotalDays || 0)}</td>
                                <td>${Number(student.Present || 0)}</td>
                                <td>${Number(student.Absent || 0)}</td>
                                <td>${Number(student.Late || 0)}</td>
                                <td>${Number(student.AttendancePercentage || 0).toFixed(2)}%</td>
                            </tr>
                        `).join("")
                        : `<tr><td colspan="8">No students found.</td></tr>`;
                }

                // DETAILED ATTENDANCE RECORDS
                const recordsTable =
                    document.getElementById("reportRecords");

                const records = data.records || [];

                if (recordsTable) {
                    recordsTable.innerHTML = records.length
                        ? records.map(record => `
                            <tr>
                                <td>${escapeHTML(record.StudentNumber)}</td>
                                <td>${escapeHTML(record.FirstName)} ${escapeHTML(record.LastName)}</td>
                                <td>${escapeHTML(record.ClassName || "Not assigned")}</td>
                                <td>${formatReportDate(record.AttendanceDate)}</td>
                                <td>${escapeHTML(record.Status)}</td>
                            </tr>
                        `).join("")
                        : `<tr><td colspan="5">No attendance records found for this period.</td></tr>`;
                }

                // DISPLAY REPORT
                if (reportOutput) {
                    reportOutput.hidden = false;
                }

                if (printReport) {
                    printReport.disabled = false;
                }

                reportMessage.textContent =
                    "Attendance report generated successfully.";

            } catch (error) {
                console.error("Report generation error:", error);

                if (reportMessage) {
                    reportMessage.textContent = error.message;
                }

                if (printReport) {
                    printReport.disabled = true;
                }
            }
        });
    }

    // PRINT OR SAVE AS PDF
   
// ==========================================
// DOWNLOAD ATTENDANCE REPORT AS PDF
// ==========================================

const downloadPDF = document.getElementById("downloadPDF");

if (downloadPDF) {
    downloadPDF.addEventListener("click", () => {
        try {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("PDF library not loaded. Please refresh the page.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF("p", "mm", "a4");

            const studentTable = document.getElementById("reportStudentSummary");
            const recordsTable = document.getElementById("reportRecords");

            if (!studentTable || !recordsTable) {
                alert("Report tables could not be found.");
                return;
            }

            if (!studentTable.rows.length || !recordsTable.rows.length) {
                alert("Please generate an attendance report first.");
                return;
            }

            const startDate = document.getElementById("reportStartDate")?.value || "";
            const endDate = document.getElementById("reportEndDate")?.value || "";

            const total = document.getElementById("reportTotalRecords")?.textContent || "0";
            const present = document.getElementById("reportPresent")?.textContent || "0";
            const absent = document.getElementById("reportAbsent")?.textContent || "0";
            const late = document.getElementById("reportLate")?.textContent || "0";
            const percentage = document.getElementById("reportAttendancePercentage")?.textContent || "0%";

            const generatedAt = new Date().toLocaleString("en-GB");

            // COLORS
            const navy = [1, 56, 110];
            const blue = [37, 99, 235];
            const grey = [100, 116, 139];

            // HEADER
            doc.setFillColor(...navy);
            doc.rect(0, 0, 210, 42, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(21);
            doc.text("ATTENDWITHEASE", 14, 17);

            doc.setFontSize(12);
            doc.text("STUDENT ATTENDANCE REPORT", 14, 27);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("OFFICIAL ATTENDANCE RECORD", 14, 35);

            // REPORT INFORMATION
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("1. REPORT INFORMATION", 14, 55);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Period: ${startDate} to ${endDate}`, 14, 64);
            doc.text(`Generated: ${generatedAt}`, 14, 71);

            // ATTENDANCE SUMMARY
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("2. ATTENDANCE OVERVIEW", 14, 86);

            const summaryData = [
                ["Total Records", total],
                ["Present", present],
                ["Absent", absent],
                ["Late", late],
                ["Attendance Rate", percentage]
            ];

            doc.autoTable({
                startY: 92,
                head: [["METRIC", "VALUE"]],
                body: summaryData,
                theme: "grid",
                headStyles: {
                    fillColor: navy,
                    textColor: 255
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                margin: { left: 14, right: 14 }
            });

            // STUDENT SUMMARY
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text(
                "3. STUDENT ATTENDANCE SUMMARY",
                14,
                doc.lastAutoTable.finalY + 13
            );

            const studentHeaders = [
                "Student No.",
                "Student Name",
                "Class",
                "Days",
                "Present",
                "Absent",
                "Late",
                "Rate"
            ];

            const studentRows = Array.from(studentTable.querySelectorAll("tr"))
                .filter(row => row.querySelectorAll("td").length === 8)
                .map(row => Array.from(row.querySelectorAll("td"))
                    .map(cell => cell.textContent.trim()));

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 19,
                head: [studentHeaders],
                body: studentRows,
                theme: "striped",
                headStyles: {
                    fillColor: navy,
                    textColor: 255,
                    fontSize: 7
                },
                styles: {
                    fontSize: 7,
                    cellPadding: 2
                },
                margin: { left: 10, right: 10 }
            });

            // DETAILED ATTENDANCE RECORDS
            const detailStartY = doc.lastAutoTable.finalY + 15;

            if (detailStartY > 260) {
                doc.addPage();
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("4. DETAILED ATTENDANCE RECORDS", 14, 20);
            } else {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("4. DETAILED ATTENDANCE RECORDS", 14, detailStartY);
            }

            const recordRows = Array.from(recordsTable.querySelectorAll("tr"))
                .filter(row => row.querySelectorAll("td").length === 5)
                .map(row => Array.from(row.querySelectorAll("td"))
                    .map(cell => cell.textContent.trim()));

            doc.autoTable({
                startY: detailStartY > 260 ? 27 : detailStartY + 6,
                head: [[
                    "Student No.",
                    "Student Name",
                    "Class",
                    "Date",
                    "Status"
                ]],
                body: recordRows,
                theme: "striped",
                headStyles: {
                    fillColor: blue,
                    textColor: 255
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5
                },
                margin: { left: 10, right: 10 },
                didDrawPage: function () {
                    doc.setFontSize(8);
                    doc.setTextColor(...grey);
                }
            });

            // FOOTER AND PAGE NUMBERS
            const pageCount = doc.internal.getNumberOfPages();

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(...grey);

                doc.text(
                    "AttendwithEase | Student Attendance Management System",
                    14,
                    287
                );

                doc.text(
                    `Page ${i} of ${pageCount}`,
                    196,
                    287,
                    { align: "right" }
                );
            }

            // SAVE PDF
            doc.save(`AttendwithEase_Attendance_Report_${startDate}_to_${endDate}.pdf`);

        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Could not generate PDF. Check the browser console for details.");
        }
    });
}


    // INITIALIZE APPLICATION
    async function initializeApp() {
        await loadClasses();
        await loadStudents();
        await loadTodayAttendance();
        await loadAttendanceSummary();
    }

    initializeApp();

});
