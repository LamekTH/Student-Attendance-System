
const { connectDB } = require("./backend/db");

async function testConnection() {
    let pool;

    try {
        pool = await connectDB();

        const result = await pool.request().query(
            "SELECT DB_NAME() AS DatabaseName"
        );

        console.log(
            "Connected database:",
            result.recordset[0].DatabaseName
        );

    } catch (error) {
        console.error("Test failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

testConnection();
