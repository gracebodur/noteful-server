const path = require('path')
const express = require('express')
const logger = require('../logger')
const { notes } = require('../notes-store')
const uuid = require('uuid/v4')
const NotesService = require('./notes-service')
const jsonParser = express.json()
const notesRouter = express.Router()

notesRouter
    .route('/notes')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes)
            })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
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

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            logger.info(`Note with id: ${newNote.id} created`)
            res
            .status(201)
            .location(path.posix.join(req.originalUrl, `${newNote.id}`))
            .json(newNote)
        })
        .catch(next)        
    })

notesRouter
    .route('/notes/:id')
    .get((req, res) => {
        const { id } = req.params
        const note = notes.find(n => n.id == id)
        NotesService.getNoteById(
            req.app.get('db'),
            id
        )
        .then(note => {
            if(!note) {
                return res.status(404).json({
                    error: { message: `Note doesn't exist`}
                })
            }
            res.json(note)
        })
        .catch(next)
    })
    .delete((req, res, next) => {
        const { id } = req.params
        const noteIndex = notes.findIndex(n => n.id == id)

        if(noteIndex === -1) {
            logger.error(`Note with id: ${id} not found.`)
            return res 
                .status(400)
                .send('Note not found')
        }

        NotesService.deleteNote(
            req.app.get('db'), id )
        .then(deletedNote => {
        logger.info(`Note with id: ${id} deleted.`)
        res
            .status(204)
            .end()
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body
        const noteToUpdate = { name }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
            if(numberOfValues === 0) {
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a note name`
                    }
                })
            }
        NotesService.updateNote(
            req.app.get('db'),
            req.params.id,
            noteToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = notesRouter