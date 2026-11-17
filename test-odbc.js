
const odbc = require("msnodesqlv8");

const connectionString =
    "Driver={ODBC Driver 18 for SQL Server};" +
    "Server=TANGIMACHINE;" +
    "Database=StudentAttendanceDB;" +
    "Trusted_Connection=yes;" +
    "Encrypt=no;";

async function testODBC() {
    let connection;

    try {
        connection = await odbc.promises.open(connectionString);

        console.log("ODBC connection successful!");

        const result = await connection.promises.query(
            "SELECT DB_NAME() AS DatabaseName"
        );

        console.log("Database:", result.first[0].DatabaseName);

    } catch (error) {
        console.error("ODBC test failed:", error.message);

    } finally {
        if (connection) {
            await connection.promises.close();
        }
    }
}

testODBC();
