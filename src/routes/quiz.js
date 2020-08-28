const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const quizController = require("../controllers/quiz");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

// Quiz routes
router.post("/start", isAuth, quizController.createQuizQuestions);
router.post("/:quizId", isAuth, quizController.startQuiz);

router.delete("/:userId", isAdmin, quizController.deleteUserGames);

module.exports = router;
