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
    .post(jsonParser, (req, res) => {
        const id = uuid()
        // const modified = new Date()
        const { name, folderId, content } = req.body
        const newNote = { id, name, folderId, content }

        for (const [key, value] of Object.entries(newNote)) {
            if (value == null) {
              return res.status(400).json({
                error: { message: `Missing '${key}' in request body` }
              })
            }
        }

        notes.push(newNote)
        logger.info(`Note with id: ${newNote.id} created`)
        return res
            .status(201)
            .location(`http://localhost:8000/notes/${newNote.id}`)
            .json(newNote)
    })
        // if(!name) {
        //     logger.error(`New note name is required`)
        //     return res
        //         .status(400)
        //         .json({
        //             error: {message: `Missing 'name' in request body`}
        //         })
        // }
        // if(!folderId) {
        //     logger.error(`New note folderId is required`)
        //     return res
        //         .status(400)
        //         .json({
        //             error: {message: `Missing 'folderId' in request body`}
        //         })
        // }
        // if(!content) {
        //     logger.error(`New note content is required`)
        //     return res
        //         .status(400)
        //         .json({
        //             error: {message: `Missing 'content' in request body`}
        //         })
        // }

module.exports = notesRouter