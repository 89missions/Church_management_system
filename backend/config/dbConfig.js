require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 5,
    ssl: { rejectUnauthorized: false }
});

const originalQuery = pool.query.bind(pool);
pool.query = async (...args) => {
    try {
        return await originalQuery(...args);
    } catch (err) {
        if (err.message.includes('timeout') || err.message.includes('terminated')) {
            console.log('Connection lost, retrying...');
            await new Promise(res => setTimeout(res, 2000));
            return await originalQuery(...args);
        }
        throw err;
    }
};

module.exports = pool;