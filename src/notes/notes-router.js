const express = require('express')
const logger = require('../logger')
const { notes } = require('../notes-store')
const uuid = require('uuid/v4')
const jsonParser = express.json()
const notesRouter = express.Router()

notesRouter
    .route('/notes')
    .get((req, res) => {
        res.json(notes)
    })

    module.exports = notesRouter