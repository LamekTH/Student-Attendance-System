
// Display today's date
const currentDate = document.getElementById("currentDate");

const today = new Date();

currentDate.textContent = today.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
});

// Search attendance records
const searchInput = document.getElementById("searchInput");
const attendanceTable = document.getElementById("attendanceTable");
const noResults = document.getElementById("noResults");

searchInput.addEventListener("input", function () {

    const searchValue = this.value.toLowerCase().trim();

    const rows = attendanceTable.querySelectorAll("tr");

    let visibleRows = 0;

    rows.forEach(row => {

        const studentDetails = row.textContent.toLowerCase();

        if (studentDetails.includes(searchValue)) {
            row.style.display = "";
            visibleRows++;
        } else {
            row.style.display = "none";
        }

    });

    noResults.hidden = visibleRows !== 0;

});
