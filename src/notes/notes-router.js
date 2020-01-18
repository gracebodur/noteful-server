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

notesRouter
    .route('/notes/:id')
    .get((req, res) => {
        const { id } = req.params
        const note = notes.find(n => n.id == id)

        if(!note) {
            logger.error(`Note with id: ${id} not found.`)
            return res
                .status(404)
                .send('Note not found')
        }
        res.json(note)
    })
    .delete((req, res) => {
        const { id } = req.params
        const noteIndex = notes.findIndex(n => n.id == id)

        if(noteIndex === -1) {
            logger.error(`Note with id: ${id} not found.`)
            return res 
                .status(400)
                .send('Note not found')
        }

        notes.splice(noteIndex, 1)
        logger.info(`Note with id: ${id} deleted.`)
        res
        .status(204)
        .end()
    })

module.exports = notesRouter