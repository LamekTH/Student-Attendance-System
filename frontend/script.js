
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

                    // Remove deleted student's unsaved attendance status
                    delete attendanceStatus[id];

                    // Refresh application data
                    await loadStudents();
                    await loadTodayAttendance();
                    await loadAttendanceSummary();

                    // Refresh student search results
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

    // INITIALIZE APPLICATION
    async function initializeApp() {
        await loadClasses();
        await loadStudents();
        await loadTodayAttendance();
        await loadAttendanceSummary();
    }

    initializeApp();

});
