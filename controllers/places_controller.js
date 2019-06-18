require('dotenv').config()
const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
let VerifyToken = require('./auth_controller.js');

module.exports = router;

// router.post('/new', VerifyToken, async (req, res) => { 
//     let user_id = req.user_id

// })

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

router.get('/tags', async (req, res) => { 
    try {
        const {rows} = await db.query('SELECT * FROM tags;')

        let optionResults = rows.map( (item) => {
            return (
                { value: item.tag_id, label: capitalizeFirstLetter(item.tag_name)}
            )
        })
        // console.log(rows)
        // console.log(optionResults)
        res.status(200).json(optionResults)
    } catch(e){
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
    }
})

router.post('/new', VerifyToken, async (req, res) => { 
    //Add code to save a new place here
    let current_user_id = req.user_id
    const {place_id, address, name, google_url, tag, new_tag, review_text, rating } = req.body

    try {
        // If this is a new_tag, the tag is a string value
            // Else, it is a int tag_id value
        let tag_id
        if (new_tag === true) {
            const tagResults = await db.query(`
                INSERT INTO tags (tag_name)
                VALUES ($1)
                RETURNING tag_id; 
            `, [tag])
            tag_id = tagResults.rows[0].tag_id
        } else {
            tag_id = tag
        }
        // Store the place info in the 'users_places' table
        const placesResults = await db.query(`
            INSERT INTO users_places (user_id, place_name, place_id, address, google_url, date_added, rating, review)
            VALUES ($1, $2, $3, $4, $5, current_date, $6, $7)
            RETURNING entry_id, user_id, place_name, place_id, address, google_url, date_added, rating, review;
        `, [current_user_id, name, place_id, address, google_url, rating, review_text])
        // Save the new entry_id to associate with the tag(s)
        let stored_entry_id = placesResults.rows[0].entry_id

        
        const placeTagResults = await db.query(`
            INSERT INTO user_places_tags (entry_id, tag_id)
            VALUES ($1, $2)
            RETURNING id, entry_id, tag_id
        `, [stored_entry_id, tag_id])

        res.status(200).json({
            place: placesResults.rows[0],
            tag: placeTagResults
        })
    
    } catch(e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
    }

    // If we have newTag = true
        // Store the new tag in the 'tags' table, return the new id number
    // Else ]
        // Lookup the number for the tag
    
    // Store the rest of the information in the places tab
    // Store info in the user_places table
    // Store the tag info in the user_places_tags table

})

// // const options = [
//     { value: 'chocolate', label: 'Chocolate' },
//     { value: 'strawberry', label: 'Strawberry' },
//     { value: 'vanilla', label: 'Vanilla' }