const { Pool } = require('pg')

connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
const pool = new Pool({
    connectionString : connectionString,
})

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback)
    }
}