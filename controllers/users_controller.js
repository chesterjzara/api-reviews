require('dotenv').config()
const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

// router.get('/', (req, res) => { 
//     db.query('SELECT * FROM users')
//         .then( foundUsers => {
//             res.status(200).json(foundUsers.rows)
//         })
//         .catch(e => console.error(e.stack))
// })


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
        let token = jwt.sign( { id: createdUser["user_id"]}, process.env.HASHSECRET, {
            expiresIn: 86400
        })
        
        res.status(200).json( {user: createdUser, token: token})

    } catch (e) {
        // console.error(e)
        if(e.code == "23505") {
            res.status(400).json({
                status: 400,
                message: 'Duplicate email entered, unable to create account.'
            })
        }
        else {
            res.status(400).json({
                status: 400,
                message: e.stack,
            })
        }
    }
})


router.get('/me', async (req, res) => { 
    let token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).send({ auth: false, message: 'No token provided.'});
    }
    jwt.verify(token, process.env.HASHSECRET, (err, decoded) => { 
        if(err) {
            return res.status(500).json({ auth: false, message: 'Failed to authenticate with token.'})
        }

        db.query('SELECT * FROM users WHERE user_id=$1', [decoded.id], (err, results) => { 
            let user = results.rows[0]
            if(err) {
                return res.status(500).json("There was an error finding the user.")
            }
            if(!user) {
                return res.status(404).json("No user found")
            }
            res.status(200).send(user);
        })
    })
})

router.get('/', async (req, res) => { 
    try {
        const { rows } = await db.query('SELECT * FROM users')
        res.status(200).json(rows)
    } catch(e) {
        console.error(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
    }
})

router.get('/:id', async (req, res) => { 
    try {
        const { id } = req.params
        const { rows } = await db.query('SELECT * FROM users WHERE user_id=$1',[id])
        res.status(200).json(rows[0])
    } catch (e) {
        console.log(e.stack)
    }
})




module.exports = router;