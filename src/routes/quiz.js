const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const quizController = require("../controllers/quiz");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");

// Quiz routes
router.post("/create-quiz", isAuth, quizController.createQuizQuestions);
router.post("/quiz/:quizId", isAuth, quizController.startQuiz);

// router.delete('/delete-quizzes', isAdmin, quizController.deleteQuizzes);

// router.get("/get-users", isAuth, quizController.getUserNumOfGames);
// router.get("/num-of-games", isAuth, quizController.numOfGames);
router.get("/active-games", isAuth, quizController.activeGames);
router.delete("/quiz/:userId", isAdmin, quizController.deleteUserGames);
// router.get('/best-today', isAuth, quizController.getBestPlayerToday);
// router.get("/played-today", isAuth, quizController.playedToday);

// Ranking list routes
router.get("/ranking-lists", quizController.getRankingLists);
router.get("/myscores", isAuth, quizController.getMyScores);
router.get("/stats", isAuth, quizController.statistics);

// Successful and unsuccessful questions
// router.get(
//   "/questions/successful",
//   isAdmin,
//   quizController.theMostSuccessfulQuestions
// );
// router.get(
//   "/questions/unsuccessful",
//   isAdmin,
//   quizController.theMostUnsuccessfulQuestions
// );

// Question routes
router.get("/get-questions", isAdmin, quizController.getQuestions);

// Add question
router.post(
  "/add-question",
  [
    body("text")
      .isLength({ min: 5 })
      .withMessage("Tekst pitanja mora imati minimum 5 karaktera"),
    body("points").custom((value) => {
      if (value == 10 || value == 15 || value == 20) {
        return true;
      } else {
        return Promise.reject("Unesi ispravno broj bodova.");
      }
    }),
    body("answer1")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.correct ||
          value === req.body.answer2 ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("answer2")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.correct ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("answer3")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.answer2 ||
          value === req.body.correct
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("link").isLength({ min: 1 }).withMessage("Unesi ispravno link."),
    body("correct")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.answer2 ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
  ],
  isAdmin,
  quizController.addQuestion
);

// Edit question
router.patch(
  "/edit-question/:questionId",
  [
    body("text")
      .isLength({ min: 5 })
      .withMessage("Tekst mora imati minimum 5 karaktera"),
    body("points").custom((value) => {
      if (value == 10 || value == 15 || value == 20) {
        return true;
      } else {
        return Promise.reject("Unesi ispravno broj bodova.");
      }
    }),
    body("answer1")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.correct ||
          value === req.body.answer2 ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("answer2")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.correct ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("answer3")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.answer2 ||
          value === req.body.correct
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
    body("link").isLength({ min: 1 }).withMessage("Unesi ispravno link."),
    body("correct")
      .isLength({ min: 1 })
      .withMessage("Unesi ispravno odgovore.")
      .custom((value, { req }) => {
        if (
          value === req.body.answer1 ||
          value === req.body.answer2 ||
          value === req.body.answer3
        ) {
          return Promise.reject("Odgovori moraju biti različiti.");
        }
        return true;
      }),
  ],
  isAdmin,
  quizController.editQustion
);

// Delete question
router.delete("/delete/:questionId", isAdmin, quizController.deleteQuestion);

module.exports = router;