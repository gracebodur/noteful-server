const path = require('path')
const express = require('express')
const logger = require('../logger')
// const { folders } = require('../folder-store')
const uuid = require('uuid/v4')
const FoldersService = require('./folders-service')

const jsonParser = express.json()
const foldersRouter = express.Router()

foldersRouter
    .route('/folders')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders)
            })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const id = uuid()
        const { name } = req.body
        const newFolder = { id, name }

        if(!name) {
            logger.error(`Folder name is required`)
            return res
                .status(400)
                .send('Folder name is required')
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
        .then(bookmark => {
            logger.info(`Folder with id: ${newFolder.id} created`)
            res
            .status(201)
            .location(path.possix.join(req.originalUrl, `${newFolder.id}`))
            .json(newFolder)
        })
        .catch(next)
    })

foldersRouter
    .route('/folders/:id')
    .get((req, res) => {
        const { id } = req.params
        FoldersService.getFolderById(
            req.app.get('db'),
            id
        )
        .then(folder => {
            if(!folder) {
                return res.status(404).json({
                    error: { message: `Folder doesn't exist`}
                })
            }
            res.json(folder)
        })
        .catch(next)
    })
    .delete((req, res, next) => {
        const { id } = req.params
        const folderIndex = folders.findIndex(f => f.id == id)

        if(folderIndex === -1) {
            logger.error(`Folder with id: ${id} not found.`)
            return res
                .status(400)
                .send('Folder not found')
           }

        FoldersService.deleteFolder(
            req.app.get('db'), id )
            .then(deletedFolder => {
            logger.info(`Folder with id: ${id} deleted.`)
            res
                .status(204)
                .end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body
        const folderToUpdate = { name }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
            if(numberOfValues === 0) {
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a folder name`
                    }
                })
            }
        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.id,
            folderToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
              
module.exports = foldersRouter 
