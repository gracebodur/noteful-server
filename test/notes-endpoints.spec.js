const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray } = require('./fixtures/notes.fixtures')

describe('Notes Endpoints', function() {
    let db
   
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    // before('clean the table', () => db('notes').truncate())

    afterEach('cleanup', () => db('notes').truncate())

    describe(`GET /notes`, () => {
        context(`Given no notes`, () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        
        context('Given there are notes in the database', () => {
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it('responds with 200 and all of the notes', () => {
                return supertest(app)
                .get('/notes')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testNotes)
            })
        })
    })

    describe(`GET /notes/:id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404 when notes doesn't exist`, () => {
                return supertest(app)
                    .get(`/notes/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: {message: `Notes doesn't exist`}})
            })
        })

        context(`Given there are notes in the database`, () => {
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it('responds with 200 and the specified note', () => {
                const noteId = 2
                const expectedNote = testNotes[noteId - 1]
                return supertest(app)
                    .get(`/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedNote)
            })
        })

        context(`Given an XSS attack note`, () => {
            const maliciousNotes = {
              id: 911,
              name: 'Naughty naughty very naughty <script>alert("xss");</script>',
            }
       
            beforeEach('insert malicious note', () => {
              return db
                .into('notes')
                .insert([ maliciousNotes ])
            })
       
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/notes/${maliciousNotes.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                  expect(res.body.name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                })
            })
          })
    })

    describe(`POST /notes`, () => {
        it(`creates a note, responding with 201 and the new note`,  function() {
        const newNote = {
            name  : "Test POST note",
         }
          return supertest(app)
            .post('/notes')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(newNote)
            .expect(201)
            .expect(res => {
                 expect(res.body.name).to.eql(newNote.name)
                 expect(res.body).to.have.property('id')
                 expect(res.headers.location).to.eql(`/notes/${res.body.id}`)
            })
            .then(res => 
            supertest(app)
                .get(`/notes/${res.body.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(res.body)
            )
        })
        
        const requiredFields = ['name']

           requiredFields.forEach(field => {
            const newNote = {
                name  : "Test POST note",
              }
                it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newNote[field]
                return supertest(app)
                  .post('/notes')
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send(newNote)
                  .expect(400, {
                    error: { message: `Missing '${field}' in request body` }
                })
            })
        })

    describe(`DELETE /notes/:id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
              const noteId = 123456
              return supertest(app)
                .delete(`/notes/${noteId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Note doesn't exist` } })
            })
       })

        context('Given there are notes in the database', () => {
            const testNotes = makeNotesArray()
         
            beforeEach('insert notes', () => {
                return db
                 .into('notes')
                 .insert(testNotes)
            })
         
            it('responds with 204 and removes the note', () => {
                const idToRemove = 2
                const expectedNote = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                .delete(`/notes/${idToRemove}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(204)
                .then(res =>
                    supertest(app)
                    .get(`/notes`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(expectedNote)
                    )
                })
            })
        })

    describe(`PATCH /notes/:id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                  .patch(`/notes/${noteId}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(404, { error: { message: `Note doesn't exist` } })
              })
            })

            context('Given there are notes in the database', () => {
             const testNotes = makeNotesArray()
        
             beforeEach('insert notes', () => {
               return db
                 .into('notes')
                 .insert(testNotes)
             })
        
            it('responds with 204 and updates the note', () => {
               const idToUpdate = 2
               const updateNote = {
                name: 'updated note name',
               }
               const expectedNote = {
                ...testNotes[idToUpdate - 1],
                ...updateNote
              }
               return supertest(app)
                 .patch(`/notes/${idToUpdate}`)
                 .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                 .send(updateNote)
                 .expect(204)
                 .then(res =>
                    supertest(app)
                      .get(`/notes/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .expect(expectedNote)
                )
             })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                  .patch(`/notes/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .send({ irrelevantField: 'foo' })
                  .expect(400, {
                    error: {
                      message: `Request body must contain a note 'name'`
                    }
                  })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const updateNote = {
                      name: 'updated note name',
                    }
                    const expectedNote = {
                      ...testNotes[idToUpdate - 1],
                      ...updateNote
                    }
              
                    return supertest(app)
                      .patch(`/notes/${idToUpdate}`)
                      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                      .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in GET response'
                      })
                      .expect(204)
                      .then(res =>
                        supertest(app)
                          .get(`/notes/${idToUpdate}`)
                          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                          .expect(expectedNote)
                        )
                })
           })
        })
    })
})
