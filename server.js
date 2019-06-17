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

// //Use express-session to track logins
// const session = require('express-session');
// app.use(session({
//     secret: process.env.SESSIONSECRET, //some random string - TODO add to ENV
//     resave: false,
//     saveUninitialized: false
// }));

// Allow CORS --https://dzone.com/articles/cors-in-node

app.use(function(req, res, next) {
    // Previously
    // res.header("Access-Control-Allow-Origin", "*");
    // New testing
    res.header("Access-Control-Allow-Origin", "http://localhost:3006");
    res.header("Access-Control-Allow-Credentials", true);
    
    // Added x-access-token to list
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    next();
});

///////////////////////////////
//      Postgres DB
//////////////////////////////


const usersController = require('./controllers/users_controller.js');
app.use('/users', usersController);

const friendsController = require('./controllers/friends_controller.js')
app.use('/friends', friendsController)