require('dotenv').config()
const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
let VerifyToken = require('./auth_controller.js');

module.exports = router;

router.post('/request/:id', VerifyToken, async (req, res) => { 
    let friendTarget = req.params.id
    let friendRequestor = req.user_id
    let rows;
    try {
        results = await db.query(`
            SELECT * FROM users_friends
            WHERE 
                (user_a = $1 AND user_b = $2) OR
                (user_a = $2 AND user_b = $1);
        `, [friendTarget, friendRequestor])
        rows = results.rows
    } catch (e) {
        res.status(400).json({
            status: 400,
            message: 'An error occurred in the friendship search, try again.'
        })
    }
   
    // Check if existing friend request rows were found...
    if(rows.length > 0 ) {
        res.status(200).json( 'Friendship already found or pending.')
    } 
    // If not found, add a new row to the Friendship table (send friend request)
    else {
        try {
            const { rows } = await db.query(`
                INSERT INTO users_friends (user_a, user_b, status)
                VALUES ($1, $2, $3)
                RETURNING user_a, user_b, status;
            `, [friendRequestor, friendTarget, 'pending'])
    
            res.status(200).json( rows )
        } catch (e) {
            res.status(400).json({
                status: 400,
                message: 'An error occurred sending friend request, try again.'
            })
        }
    }
    
})

router.get('/request/sent', VerifyToken, async (req, res) => {
    let friendRequestor = req.user_id
    try {
        const { rows } = await db.query(`
            SELECT * FROM users_friends
            WHERE (user_a = $1 AND status LIKE 'pending');
        `, [friendRequestor])
        
        res.status(200).json( rows )
        
    } catch (e) {
        res.status(400).json({
            status: 400,
            message: 'An error occurred in the friendship search, try again.'
        })
    }

})

router.get('/request/pending', VerifyToken, async (req, res) => { 
    let friendTarget = req.user_id
    try {
        const { rows } = await db.query(`
            SELECT * FROM users_friends
            WHERE (user_b = $1 AND status LIKE $2);
        `, [friendTarget, 'pending'])
        
        res.status(200).json( rows )
        
    } catch (e) {
        res.status(400).json({
            status: 400,
            message: 'An error occurred in the friendship search, try again.'
        })
    }
})

router.put('/request/confirm/:id', VerifyToken, async (req, res) => { 
    let friendTarget = req.user_id
    let friendRequestor = req.params.id
    try {
        const result1 = await db.query(`
            UPDATE users_friends
            SET status = $3
            WHERE (user_b = $1 AND user_a = $2);
        `, [friendTarget, friendRequestor, 'confirmed'])
        
        console.log('initial update')
    } catch (e) {
        res.status(400).json({
            status: 400,
            message: 'An error occurred accepting the friend request, try again.'
        })
    }
    try {
        const result2 = await db.query(`
            INSERT INTO users_friends (user_a, user_b, status)
            VALUES ($1, $2, $3)
        `, [friendTarget, friendRequestor, 'confirmed'])

        console.log('new row')
    } catch (e) {
        res.status(400).json({
            status: 400,
            message: 'An error occurred accepting the friend request, try again.'
        })
    }

    res.status(200).json({
        message: 'Friendship created',
        friendRequestor: friendRequestor,
        friendTarget: friendTarget
    })
})

router.delete('/delete/:id', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id
    let deleteUser = req.params.id

    const { rowCount } = await db.query(`
        DELETE FROM users_friends
        WHERE 
            (user_a = $1 AND user_b = $2) OR
            (user_a = $2 AND user_b = $1);
    `, [current_user_id, deleteUser])

    if(rowCount > 0) {
        res.status(200).json( { deleted: true, rowCount: rowCount} )
    } else {
        res.status(200).json( { deleted: false, rowCount: rowCount} )
    }
})

router.post('/search', VerifyToken, async (req, res) => { 
    let {searchTerm} = req.body
    let current_user_id = req.user_id
    try {
        console.log('searchTerm:', searchTerm, 'currID:',current_user_id)
        let { rows } = await db.query(`
            SELECT 
                a.first_name,
                a.user_id,
                b.first_name,
                b.last_name,
                b.user_id,
                users_friends.status
            FROM users_friends
            LEFT JOIN users as a 
                on users_friends.user_a = a.user_id
            LEFT JOIN users as b
                on users_friends.user_b = b.user_id
            WHERE (b.first_name LIKE $1 OR b.last_name LIKE $1);
        `, [searchTerm])

        res.status(200).json(rows);

    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred in your friend search, try again.'
        })
    }
})

router.get('/', VerifyToken, async (req, res) => {
    console.log('Return all current friends for this user')
    let current_user_id = req.user_id
    const { rows } = await db.query(`
        SELECT * FROM users_friends
        WHERE user_a = $1 AND status LIKE $2;
    `, [current_user_id, 'confirmed'])

    res.status(200).json( rows )
})
