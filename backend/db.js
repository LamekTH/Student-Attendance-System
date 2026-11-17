
const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
    connectionString:
        "Driver={ODBC Driver 18 for SQL Server};" +
        `Server=${process.env.DB_SERVER};` +
        `Database=${process.env.DB_DATABASE};` +
        "Trusted_Connection=yes;" +
        "Encrypt=no;"
};

async function connectDB() {
    try {
        const pool = await sql.connect(config);

        console.log("Connected to SQL Server successfully!");

        return pool;

    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error;
    }
}

module.exports = { sql, connectDB };
