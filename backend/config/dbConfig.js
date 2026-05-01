require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 5,
    ssl: { rejectUnauthorized: false }
})

module.exports = pool