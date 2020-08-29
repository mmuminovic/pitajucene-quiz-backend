const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const {
    getQuestions,
    addQuestion,
    editQustion,
    deleteQuestion,
} = require('../controllers/question')
const isAdmin = require('../middlewares/isAdmin')

// Get questions
router.get('/get-questions', isAdmin, getQuestions)

// Add question
router.post(
    '/add-question',
    [
        body('text')
            .isLength({ min: 5 })
            .withMessage('Tekst pitanja mora imati minimum 5 karaktera'),
        body('points').custom((value) => {
            if (value == 10 || value == 15 || value == 20) {
                return true
            } else {
                return Promise.reject('Unesi ispravno broj bodova.')
            }
        }),
        body('answer1')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.correct ||
                    value === req.body.answer2 ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('answer2')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.correct ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('answer3')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.answer2 ||
                    value === req.body.correct
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('link').isLength({ min: 1 }).withMessage('Unesi ispravno link.'),
        body('correct')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.answer2 ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
    ],
    isAdmin,
    addQuestion
)

// Edit question
router.patch(
    '/edit-question/:questionId',
    [
        body('text')
            .isLength({ min: 5 })
            .withMessage('Tekst mora imati minimum 5 karaktera'),
        body('points').custom((value) => {
            if (value == 10 || value == 15 || value == 20) {
                return true
            } else {
                return Promise.reject('Unesi ispravno broj bodova.')
            }
        }),
        body('answer1')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.correct ||
                    value === req.body.answer2 ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('answer2')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.correct ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('answer3')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.answer2 ||
                    value === req.body.correct
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
        body('link').isLength({ min: 1 }).withMessage('Unesi ispravno link.'),
        body('correct')
            .isLength({ min: 1 })
            .withMessage('Unesi ispravno odgovore.')
            .custom((value, { req }) => {
                if (
                    value === req.body.answer1 ||
                    value === req.body.answer2 ||
                    value === req.body.answer3
                ) {
                    return Promise.reject('Odgovori moraju biti različiti.')
                }
                return true
            }),
    ],
    isAdmin,
    editQustion
)

// Delete question
router.delete('/delete/:questionId', isAdmin, deleteQuestion)

module.exports = router
