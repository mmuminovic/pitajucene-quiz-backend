const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const {
    createQuizQuestions,
    startQuiz,
    deleteUserGames,
} = require('../controllers/quiz')
const isAuth = require('../middlewares/isAuth')
const isAdmin = require('../middlewares/isAdmin')

// Quiz routes
router.post('/start', isAuth, createQuizQuestions)

router.post('/:quizId', isAuth, startQuiz)

router.delete('/:userId', isAdmin, deleteUserGames)

module.exports = router
