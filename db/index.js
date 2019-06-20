const { Pool } = require('pg')

let connectionString;
try {
    if(process.env.DATABASE_URL) {
        connectionString = process.env.DATABASE_URL
    } else {
        connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
    }
} catch(e) {
    connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`
}


const pool = new Pool({
    connectionString : connectionString,
})

module.exports = {
    query: (text, params, callback) => {
        // console.log('test connectionstring:', connectionString)
        // console.log('test env database_url:', process.env.DATABASE_URL)
        return pool.query(text, params, callback)
    }
}