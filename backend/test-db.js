require('dotenv').config();

const sql = require('mssql/msnodesqlv8');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,

    driver: 'ODBC Driver 18 for SQL Server',

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server successfully!');
        return pool;
    })
    .catch(error => {
        console.error('SQL Server connection failed:', error.message);
        throw error;
    });

module.exports = { sql, poolPromise };
