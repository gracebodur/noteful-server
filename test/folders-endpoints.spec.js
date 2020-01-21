const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray } = require('./fixtures/folders.fixtures')

describe('Folders Endpoints', function() {
    let db
   
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    // before('clean the table', () => db('folders').truncate())

    afterEach('cleanup', () => db('folders').truncate())

    describe(`GET /folders`, () => {
        context(`Given no folders`, () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/folders')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        
        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
            })

            it('responds with 200 and all of the folders', () => {
                return supertest(app)
                .get('/folders')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testFolders)
            })
        })
    })

    describe(`GET /folders/:id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404 when folders doesn't exist`, () => {
                return supertest(app)
                    .get(`/folders/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: {message: `Folder doesn't exist`}})
            })
        })

        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
            })

            it('responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/folders/${folderId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedFolder)
            })
        })

        context(`Given an XSS attack folder`, () => {
            const maliciousFolders = {
              id: 911,
              name: 'Naughty naughty very naughty <script>alert("xss");</script>',
            }
       
            beforeEach('insert malicious folder', () => {
              return db
                .into('folders')
                .insert([ maliciousFolders ])
            })
       
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/folders/${maliciousFolders.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                  expect(res.body.name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                })
            })
          })
    })

    describe(`POST /folders`, () => {
        it(`creates a folder, responding with 201 and the new folder`,  function() {
        const newFolder = {
            name  : "Test POST folder",
         }
          return supertest(app)
            .post('/folders')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(newFolder)
            .expect(201)
            .expect(res => {
                 expect(res.body.name).to.eql(newFolder.name)
                 expect(res.body).to.have.property('id')
                 expect(res.headers.location).to.eql(`/folders/${res.body.id}`)
            })
            .then(res => 
            supertest(app)
                .get(`/folders/${res.body.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(res.body)
            )
        })
        
        const requiredFields = ['name']

           requiredFields.forEach(field => {
            const newFolder = {
                name  : "Test POST folder",
              }
                it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newFolder[field]
                return supertest(app)
                  .post('/folders')
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send(newFolder)
                  .expect(400, {
                    error: { message: `Missing '${field}' in request body` }
                })
            })
        })

    describe(`DELETE /folders/:id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
              const folderId = 123456
              return supertest(app)
                .delete(`/folders/${folderId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Folder doesn't exist` } })
            })
       })

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()
         
            beforeEach('insert folders', () => {
                return db
                 .into('folders')
                 .insert(testFolders)
            })
         
            it('responds with 204 and removes the folder', () => {
                const idToRemove = 2
                const expectedFolder = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                .delete(`/folders/${idToRemove}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(204)
                .then(res =>
                    supertest(app)
                    .get(`/folders`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(expectedFolder)
                    )
                })
            })
        })

    describe(`PATCH /folders/:id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                  .patch(`/folders/${folderId}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(404, { error: { message: `Folder doesn't exist` } })
              })
            })

            context('Given there are folders in the database', () => {
             const testFolders = makeFoldersArray()
        
             beforeEach('insert folders', () => {
               return db
                 .into('folders')
                 .insert(testFolders)
             })
        
            it('responds with 204 and updates the folder', () => {
               const idToUpdate = 2
               const updateFolder = {
                name: 'updated folder name',
               }
               const expectedFolder = {
                ...testFolders[idToUpdate - 1],
                ...updateFolder
              }
               return supertest(app)
                 .patch(`/folders/${idToUpdate}`)
                 .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                 .send(updateFolder)
                 .expect(204)
                 .then(res =>
                    supertest(app)
                      .get(`/folders/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedFolder)
                )
             })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                  .patch(`/folders/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send({ irrelevantField: 'foo' })
                  .expect(400, {
                    error: {
                      message: `Request body must contain a folder 'name'`
                    }
                  })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const updateFolder = {
                      name: 'updated folder name',
                    }
                    const expectedFolder = {
                      ...testFolders[idToUpdate - 1],
                      ...updateFolder
                    }
              
                    return supertest(app)
                      .patch(`/folders/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .send({
                        ...updateFolder,
                        fieldToIgnore: 'should not be in GET response'
                      })
                      .expect(204)
                      .then(res =>
                        supertest(app)
                          .get(`/folders/${idToUpdate}`)
                          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                          .expect(expectedFolder)
                        )
                })
           })
        })
    })
})
