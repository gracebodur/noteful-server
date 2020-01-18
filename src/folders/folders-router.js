const express = require('express')
const logger = require('../logger')
const { folders } = require('../store')

const jsonParser = express.Router
const foldersRouter = express.Router()

foldersRouter
    .route('/folders')
    .get((req, res) => {
        res.json(folders)
    })

module.exports = foldersRouter 