require('dotenv').config()
const { Pool, Client } = require('pg')
const express = require('express');
const morgan = require('morgan')

const app = express();
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Reviews listening on port ${PORT}...`);
})

////////////////////////////
// Middleware:
////////////////////////////
app.use(express.json());                //parse JSON requests
app.use(express.static('public')); 
app.use(morgan('tiny'));

//Use express-session to track logins
const session = require('express-session');
app.use(session({
    secret: process.env.SESSIONSECRET, //some random string - TODO add to ENV
    resave: false,
    saveUninitialized: false
}));


///////////////////////////////
//      Postgres DB
//////////////////////////////

let connectionString;
// if(ENV['DATABASE_URL']) {
//     connectionString = ENV['DATABASE_URL']
// } else {
//     connectionString = 'postgresql://postgres:rose@localhost:5432/reviews_dev'
// }

// connectionString = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`

// const pool = new Pool({
//     connectionString : connectionString,
// })

const db = require('./db/index.js')


const userController = require('./controllers/users_controller.js');
app.use('/users', userController);
