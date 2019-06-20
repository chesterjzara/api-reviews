require('dotenv').config()
const express = require('express');
const router = express.Router();
const db = require('../db/index.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
let VerifyToken = require('./auth_controller.js');

module.exports = router;

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
            tag: placeTagResults.rows[0]
        })
    
    } catch(e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
    }
})

router.put('/update/', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id
    const {entry_id, place_id, address, name, google_url, tag, new_tag, review_text, rating } = req.body

    console.log(req.body)

   try {
        // Get correct tag ID
        let tag_id
        let tagChanged = false
        let tag_entry_id
        if (new_tag === true) {
            const tagResults = await db.query(`
                INSERT INTO tags (tag_name)
                VALUES ($1)
                RETURNING tag_id; 
            `, [tag])
            tag_id = tagResults.rows[0].tag_id
            tagChanged = true

            console.log('Set new tag_id:', tag_id)


        } else {
            tag_id = tag
            const checkTag = await db.query(`
                SELECT * FROM user_places_tags
                WHERE entry_id = $1
            `, [entry_id])
            
            console.log('Check tag ------',checkTag)

            if(checkTag.rows[0].tag_id !== tag_id) {
                tagChanged = true
                tag_entry_id = checkTag.rows[0].id
            }
        }

        // Update a specific place
        const placeUpdateResults = await db.query(`
            UPDATE users_places 
            SET
                place_name = $1,
                google_url = $2,
                address = $3,
                rating = $4,
                review = $5
            WHERE entry_id = $6
            RETURNING entry_id, user_id, place_name, place_id, address, google_url, date_added, rating, review; 
        `, [name, google_url, address, rating, review_text, entry_id]);

        let updated_entry_id = placeUpdateResults.rows[0].entry_id

        if(tagChanged) {
            console.log('Changing tag', tag_id)
            const placeUpdateTagResults = await db.query(`
                UPDATE user_places_tags
                SET
                    tag_id = $1
                WHERE entry_id = $2
                RETURNING id, entry_id, tag_id;
            `, [ tag_id, updated_entry_id])
            console.log(placeUpdateTagResults)

            res.status(200).json({
                place: placeUpdateResults.rows[0],
                tag: placeUpdateTagResults.rows[0]
            })
        } else {
            res.status(200).json({
                place: placeUpdateResults.rows[0],
                tag: false
            })
        }
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
   }
})

router.delete('/delete/:entry_id', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id
    let delete_entry_id = req.params.entry_id

    console.log(current_user_id, delete_entry_id)

    try{
        const {rows} = await db.query(`
            DELETE FROM users_places
            WHERE entry_id = $1;
        `, [delete_entry_id])
    
        res.status(200).json( {test: 'success', rows: rows})
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred deleting the review, try again.'
        })
    }
})

router.get('/', VerifyToken, async (req, res) => { 
    
    const {rows} = await db.query('SELECT * FROM users_places;')
    res.status(200).json(rows)


})

router.get('/myplaces', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id

    try {
        const {rows} = await db.query(`
            SELECT 
                up.*,
                pt.tag_id,
                tags.tag_name
            FROM users_places as up
            LEFT JOIN user_places_tags as pt
                on up.entry_id = pt.entry_id
            LEFT JOIN tags
                on pt.tag_id = tags.tag_id
            WHERE up.user_id = $1;
        `, [current_user_id])

        res.status(200).json(rows)
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred, try again.'
        })
    }
})

router.get('/friends', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id

    // Get all places confirmed friends have recorded
    try {
        const {rows} = await db.query(`
            SELECT
                up.*,
                tags.tag_id,
                tags.tag_name,
                users.first_name,
                users.last_name
            FROM users_places as up
            LEFT OUTER JOIN 
                (SELECT * FROM users_friends WHERE user_a = $1) as friends
                on up.user_id = friends.user_b
            LEFT JOIN users
                on up.user_id = users.user_id
            LEFT JOIN user_places_tags as upt
                on up.entry_id = upt.entry_id
            LEFT JOIN tags
                on upt.tag_id = tags.tag_id
            WHERE friends.status = 'confirmed';
        `,[current_user_id])
    
        res.status(200).json(rows)
    
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: "An error occurred finding friends places, try again."
        })
    }


})

router.post('/search', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id
    let { search_string } = req.body
    
    try {
        const { rows } = await db.query(`
            SELECT p_search.*
            FROM (SELECT
                    up.*,
                    tags.tag_id,
                    tags.tag_name,
                    users.first_name,
                    users.last_name,
                    to_tsvector(up.place_name) ||
                    to_tsvector(up.review) ||
                    to_tsvector(up.address) ||
                    to_tsvector(tags.tag_name) as document
                FROM users_places as up
                LEFT OUTER JOIN 
                    (SELECT * FROM users_friends WHERE user_a = $1) as friends
                    ON up.user_id = friends.user_b
                LEFT JOIN users 
                    ON users.user_id = up.user_id
                LEFT JOIN user_places_tags as upt 
                    ON upt.entry_id = up.entry_id
                LEFT JOIN tags 
                    ON tags.tag_id = upt.tag_id
                WHERE 
                    (friends.status = 'confirmed' OR up.user_id = $1)
            ) p_search
            WHERE p_search.document @@ to_tsquery($2)
        `, [current_user_id, search_string])

        console.log(rows)
        res.status(200).json(rows)
    } catch (e) {
        console.log(e)
        res.status(400).json({
            status: 400,
            message: 'An error occurred in the search, try again.'
        })
    }
})

router.get('/:id', VerifyToken, async (req, res) => { 
    let current_user_id = req.user_id
    const {rows} = await db.query(`
        SELECT
            up.*,
            tags.tag_id,
            tags.tag_name,
            users.first_name,
            users.last_name
        FROM users_places as up
        LEFT OUTER JOIN 
            (SELECT * FROM users_friends WHERE user_a = $1) as friends
            on up.user_id = friends.user_b
        LEFT JOIN users
            on up.user_id = users.user_id
        LEFT JOIN user_places_tags as upt
            on up.entry_id = upt.entry_id
        LEFT JOIN tags
            on upt.tag_id = tags.tag_id
        WHERE 
            (friends.status = 'confirmed' OR up.user_id = $1)
            AND place_id=$2;
    `, [current_user_id, req.params.id])

    res.status(200).json(rows)

})

// router.get('/:id', VerifyToken, async (req, res) => { 
    
//     const {rows} = await db.query(`
//         SELECT * FROM users_places
//         WHERE entry_id = $1;
//     `, [req.params.id])

//     res.status(200).json(rows)

// })