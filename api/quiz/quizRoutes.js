const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const quizController = require('./quizController');
const isAuth = require('../middlewares/isAuth');
const isAdmin = require('../middlewares/isAdmin');

// Quiz routes
router.post('/create-quiz', isAuth, quizController.createQuizQuestions);
router.post('/quiz/:quizId', isAuth, quizController.startQuiz);

router.get('/get-users', isAuth, quizController.getUserNumOfGames);
router.get('/num-of-games', isAuth, quizController.numOfGames);
router.get('/active-games', isAuth, quizController.activeGames);
router.delete('/quiz/:userId', isAdmin, quizController.deleteUserGames);
router.get('/best-today', quizController.getBestPlayerToday);

// router.patch('/reset-questions', quizController.resetQuestionInfo);

// Ranking list routes
router.get('/myscore/:userId', isAuth, quizController.getMyScore);
router.get('/thebestscore/:userId', isAuth, quizController.getMyBestScore);
router.get('/scorelastmonth/:userId', isAuth, quizController.scoreLastMonth);
router.get('/ranking-list', isAuth, quizController.getRankingList);
router.get('/ranking-list/lastMonth', isAuth, quizController.getLastMonthList);
router.get('/ranking-list/theBestPlayers', isAuth, quizController.getTheBestRecords);

// Successful and unsuccessful questions
router.get('/questions/successful', isAdmin, quizController.theMostSuccessfulQuestions);
router.get('/questions/unsuccessful', isAdmin, quizController.theMostUnsuccessfulQuestions);

// Question routes
router.post('/get-by-condition', isAdmin, quizController.getQuestionsByCondition);

// Add question
router.post('/add-question', [
    body('text')
        .isLength({ min: 5 })
        .withMessage('Tekst pitanja mora imati minimum 5 karaktera'),
    body('points').custom(value => {
        if (value == 5 || value == 8 || value == 10) {
            return true;
        } else {
            return Promise.reject('Unesi ispravno broj bodova.');
        }
    }),
    body('answer1').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.correct || value === req.body.answer2 || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('answer2').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.correct || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('answer3').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.answer2 || value === req.body.correct) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('link').isLength({ min: 1 }).withMessage('Unesi ispravno link.'),
    body('correct').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.answer2 || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        })
], isAdmin, quizController.addQuestion);

// Edit question
router.patch('/edit-question/:questionId', [
    body('text')
        .isLength({ min: 5 })
        .withMessage('Tekst mora imati minimum 5 karaktera'),
    body('points').custom(value => {
        if (value == 5 || value == 8 || value == 10) {
            return true;
        } else {
            return Promise.reject('Unesi ispravno broj bodova.');
        }
    }),
    body('answer1').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.correct || value === req.body.answer2 || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('answer2').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.correct || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('answer3').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.answer2 || value === req.body.correct) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        }),
    body('link').isLength({ min: 1 }).withMessage('Unesi ispravno link.'),
    body('correct').isLength({ min: 1 }).withMessage('Unesi ispravno odgovore.')
        .custom((value, { req }) => {
            if (value === req.body.answer1 || value === req.body.answer2 || value === req.body.answer3) {
                return Promise.reject('Odgovori moraju biti različiti.');
            }
            return true;
        })
], isAdmin, quizController.editQustion);

// Delete question
router.delete('/delete/:questionId', isAdmin, quizController.deleteQuestion);

module.exports = router;