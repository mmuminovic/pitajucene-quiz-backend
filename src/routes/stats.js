const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const {
    getMyScores,
    getRankingLists,
    statistics,
} = require('../controllers/stats')
const isAuth = require('../middlewares/isAuth')
// Ranking list routes
router.get('/ranking-lists', getRankingLists)
router.get('/myscores', isAuth, getMyScores)
router.get('/get-stats', isAuth, statistics)

module.exports = router
