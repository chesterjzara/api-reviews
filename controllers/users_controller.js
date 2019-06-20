require('dotenv').config()
const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
let VerifyToken = require('./auth_controller.js');

module.exports = router;

router.post('/new', async (req, res) => { 
    console.log(req.body)
    let {first_name, last_name, email, password} = req.body
    password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    
    try {
        const { rows } = await db.query(`
            INSERT INTO users (first_name, last_name, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, first_name, last_name, email, password;`,
            [first_name, last_name, email, password])
        
        let createdUser = rows[0]
        let token = jwt.sign( { user_id: createdUser["user_id"]}, process.env.HASHSECRET, {
            expiresIn: 86400
        })
        
        res.status(200).json( {user: createdUser, auth: true, token: token, user_id: createdUser.user_id})

    } catch (e) {
        // console.error(e)
        if(e.code == "23505") {
            res.status(400).json({
                status: 400,
                auth: false,
                message: 'Duplicate email entered, unable to create account.',
                e : e
            })
        }
        else {
            res.status(400).json({
                status: 400,
                auth: false,
                message: 'Unable to register user, try again.',
                e : e,
            })
        }
    }
})

router.post('/login', async (req, res) => { 
    let { email } = req.body
    try {
        let {rows} = await db.query('SELECT * FROM users WHERE email=$1', [email])
        let user = rows[0]
        let passwordMatches = bcrypt.compareSync(req.body.password, user.password)
        if(!passwordMatches) {
            return res.status(401).send({ auth: false, message: 'Incorrect password'});
        } else {
            let token = jwt.sign({ user_id: user.user_id}, process.env.HASHSECRET, {expiresIn: 86400});
            res.status(200).json({ auth: true, token: token, user_id: user.user_id })
        }
    } catch(err) {
        return res.status(500).json({ auth: false, message: 'User not found.'})
    }
})

// router.put('/login', async)

router.get('/logout', (req, res) => {
    res.status(200).json({ auth: false, token: null });
});

router.get('/me', VerifyToken, async (req, res) => { 
    try {
        let { rows } = await db.query('SELECT * FROM users WHERE user_id=$1', [req.user_id]) 
        console.log(rows)
        let user = rows[0]
        if(!user) {
            return res.status(404).json("No user found")
        }
        
        res.status(200).send( { user: user, auth: true} );

    } catch (err) {
        return res.status(500).json({ auth: false, message: "There was an error finding the user."})
    }
})

router.post('/search', VerifyToken, async (req, res) => { 
    let {searchTerm} = req.body
    let current_user_id  = req.user_id
    try {
        console.log('searchTerm:', searchTerm, 'currID:',current_user_id)
        let { rows } = await db.query(`
            SELECT * FROM users 
            WHERE
                (first_name LIKE $1 OR last_name LIKE $1)
                AND user_id != $2;
        `, [searchTerm, current_user_id])

        res.status(200).json(rows);
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred in search, try again.'
        })
    }
})


router.get('/', async (req, res) => { 
    try {
        const { rows } = await db.query('SELECT * FROM users')
        res.status(200).json(rows)
    } catch(e) {
        console.error(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again. (/users)',
            e: e
        })
    }
})

router.get('/:id', VerifyToken, async (req, res) => { 
    try {
        const { id } = req.params
        let current_user_id  = req.user_id
        const { rows } = await db.query(`
        SELECT
            users.user_id,
            users.first_name,
            users.last_name,
            friends.user_a as friend_id,
            friends.status
        FROM users 
        LEFT OUTER JOIN 
            (SELECT * FROM users_friends WHERE user_a = $2) as friends
            on friends.user_b = users.user_id
        WHERE
            (users.user_id = $1);
        `,[id, current_user_id])
        console.log(rows[0])
        res.status(200).json(rows[0])
    } catch (e) {
        console.log(e.stack)
        res.status(400).json({
            status: 400,
            message: `An error occurred, unable to open this user's page`,
            e: e
        })
    }
})





