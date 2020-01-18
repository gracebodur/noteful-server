const express = require('express')
const logger = require('../logger')
const { folders } = require('../store')
const uuid = require('uuid/v4')

const bodyParser = express.Router
const foldersRouter = express.Router()

foldersRouter
    .route('/folders')
    .get((req, res) => {
        res.json(folders)
    })
    .post(bodyParser, (req, res) => {
        // const id = uuid()
        const { name } = req.body
        const newFolder = { id, name }

        if(!name) {
            logger.error(`Folder name is required`)
            return res.status(400).send('Title, url and description are required')
        }

        folders.push(newFolder)

        logger.info(`Folder with id: ${newFolder.id} created`)

        return res.status(201).location(`http://localhost:8000/folders/${newFolder.id}`).json(newFolder)
    })
              
module.exports = foldersRouter 
