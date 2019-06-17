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