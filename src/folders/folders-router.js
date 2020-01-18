const express = require('express')
const logger = require('../logger')
const { folders } = require('../store')
const uuid = require('uuid/v4')
const jsonParser = express.json()
const foldersRouter = express.Router()

foldersRouter
    .route('/folders')
    .get((req, res) => {
        res.json(folders)
    })
    .post(jsonParser, (req, res) => {
        const id = uuid()
        const { name } = req.body
        const newFolder = { id, name }

        if(!name) {
            logger.error(`Folder name is required`)
            return res
                .status(400)
                .send('Folder name is required')
        }

        folders.push(newFolder)
        logger.info(`Folder with id: ${newFolder.id} created`)
        return res
            .status(201)
            .location(`http://localhost:8000/folders/${newFolder.id}`)
            .json(newFolder)
    })

foldersRouter
    .route('/folders/:id')
    .delete((req, res) => {
        const { id } = req.params
        const folderIndex = folders.findIndex(f => f.id == id)

        if(folderIndex === -1) {
            logger.error(`Folder with id: ${id} not found.`)
            return res
                .status(400)
                .send('Folder not found')
           }

        folders.splice(folderIndex, 1)
        logger.info(`Folder with id: ${id} deleted.`)
        res
        .status(204)
        .end()
    })
              
module.exports = foldersRouter 
