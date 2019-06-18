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
                { value: item.tag_name, label: capitalizeFirstLetter(item.tag_name)}
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
    const {place_id, address, name, google_url, tag, new_tag, review_text } = req.body

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