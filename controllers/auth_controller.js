const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken')


router.post('/register', async (req, res) => { 
    let {first_name, last_name, email, password} = req.body
    password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    
    try {
        const { rows } = await db.query(`
            INSERT INTO users (first_name, last_name, email, password)   
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, first_name, last_name, email, password;`, 
            [first_name, last_name, email, password]);
        
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