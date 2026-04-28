require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
})

module.exports = pool