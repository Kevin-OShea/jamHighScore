// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
// const passport = require('passport')

// pull in Mongoose model for topScores
const TopScore = require('../models/topScore')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { topScore: { title: '', text: 'foo' } } -> { topScore: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
// const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /topScores
router.get('/topScores', (req, res, next) => {
  TopScore.find()
    .then(topScores => {
      // `topScores` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return topScores.map(topScore => topScore.toObject())
    })
    // respond with status 200 and JSON of the topScores
    .then(topScores => res.status(200).json({ topScores: topScores }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// INDEX get top 5
// GET /topScores
router.get('/topScores/getFive', (req, res, next) => {
  TopScore.find()
    .then(scores => {
      scores = scores.sort(function (a, b) {
        return b.score - a.score
      })
      if (scores.length > 10) {
        scores = scores.splice(0, 10)
      }
      for (let i = 0; i < scores.length; i++) {
        let j = i + 1
        scores[i].placement = j
      }
      let topFive = scores.splice(0, 5)
      res.status(200).json({ topScores: topFive })
    })
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /topScores/5a7db6c74d55bc51bdf39793
router.get('/topScores/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  TopScore.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "topScore" JSON
    .then(topScore => res.status(200).json({ topScore: topScore.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /topScores
router.post('/topScores', (req, res, next) => {
  TopScore.create(req.body.topScore)
    // respond to succesful `create` with status 201 and JSON of new "topScore"
    .then(topScore => {
      res.status(201).json({ topScore: topScore.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /topScores/5a7db6c74d55bc51bdf39793
router.patch('/topScores/:id', removeBlanks, (req, res, next) => {
  TopScore.findById(req.params.id)
    .then(handle404)
    .then(topScore => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, topScore)

      // pass the result of Mongoose's `.update` to the next `.then`
      return topScore.updateOne(req.body.topScore)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY all
// DELETE /topScores/5a7db6c74d55bc51bdf39793
router.delete('/topScores/all', (req, res, next) => {
  TopScore.find()
    .then(handle404)
    .then(topScore => {
      topScore.forEach(score => score.deleteOne())
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY regular
// DELETE /topScores/5a7db6c74d55bc51bdf39793
router.delete('/topScores/:id', (req, res, next) => {
  TopScore.findById(req.params.id)
    .then(handle404)
    .then(topScore => {
      // delete the topScore ONLY IF the above didn't throw
      topScore.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
