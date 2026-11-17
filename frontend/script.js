
document.addEventListener("DOMContentLoaded", () => {

    // 1. Display today's date
    const currentDate = document.getElementById("currentDate");

    const today = new Date();

    currentDate.textContent = today.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    // 2. Get dashboard elements
    const searchInput = document.getElementById("searchInput");
    const attendanceTable = document.getElementById("attendanceTable");
    const noResults = document.getElementById("noResults");
    const totalStudents = document.getElementById("totalStudents");

    // 3. Store database students
    let students = [];

    // 4. Safely display database values
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // 5. Display students in the table
    function displayStudents(studentList) {

        attendanceTable.innerHTML = "";

        studentList.forEach(student => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(student.FirstName)} ${escapeHTML(student.LastName)}</td>
                <td>${escapeHTML(student.StudentNumber)}</td>
                <td>${escapeHTML(student.ClassName || "Not assigned")}</td>
                <td>${escapeHTML(student.Gender || "Not specified")}</td>
            `;

            attendanceTable.appendChild(row);

        });

        noResults.hidden = studentList.length !== 0;
    }

    // 6. Retrieve students from SQL Server through the API
    async function loadStudents() {

        try {

            const response = await fetch("http://localhost:5000/api/students");

            if (!response.ok) {
                throw new Error("Failed to retrieve students");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Unable to load students");
            }

            students = data.students;

            // Update total student count
            totalStudents.textContent = students.length;

            // Display database records
            displayStudents(students);

            console.log("Students loaded successfully:", students);

        } catch (error) {

            console.error("Student loading error:", error);

            attendanceTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        Unable to load students. Check your backend server.
                    </td>
                </tr>
            `;
        }
    }

    // 7. Search database students
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

    // 8. Load students when dashboard opens
    loadStudents();

});
