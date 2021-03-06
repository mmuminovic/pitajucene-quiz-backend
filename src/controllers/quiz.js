const mongoose = require('mongoose')
const { shuffle } = require('../utils/shuffle')
const Question = require('../models/question')
const Quiz = require('../models/quiz')

exports.createQuizQuestions = async (req, res, next) => {
    const userId = req.user.id
    try {
        const questions = await Question.find()
        let allQuestions = []
        let pitanja1 = [],
            pitanja2 = [],
            pitanja3 = []
        questions.forEach((item) => {
            if (item.points === 10) {
                pitanja1.push(item)
            } else if (item.points === 15) {
                pitanja2.push(item)
            } else if (item.points === 20) {
                pitanja3.push(item)
            }
        })

        allQuestions = [
            ...shuffle(pitanja1).slice(0, 20),
            ...shuffle(pitanja2).slice(0, 20),
            ...shuffle(pitanja3).slice(0, 20),
        ]

        let questionIds = allQuestions.map((q) => {
            const data = { question: q._id }
            return data
        })

        let answers = [
            allQuestions[0].correct,
            allQuestions[0].answer1,
            allQuestions[0].answer2,
            allQuestions[0].answer3,
        ]
        answers = shuffle(answers)

        const quizQuestions = new Quiz({
            _id: new mongoose.Types.ObjectId(),
            takenBy: userId,
            questions: [...questionIds],
        })

        const newQuiz = await quizQuestions.save()

        res.status(201).json({
            quiz: newQuiz._id,
            question: {
                id: allQuestions[0]._id,
                text: allQuestions[0].text,
                answers,
                points: allQuestions[0].points,
                num: 0,
            },
        })
    } catch (error) {
        res.status(500).json({
            error: {
                message: 'Desila se greška na serveru. Pokušajte ponovo.',
            },
        })
    }
}

exports.startQuiz = async (req, res, next) => {
    const { quizId } = req.params
    const { answer: ans, continuing: isQuizStarted } = req.body
    const continuing = isQuizStarted ? true : false
    try {
        const quiz = await Quiz.findOne({ _id: quizId })
            .where('createdAt')
            .gt(new Date(Date.now() - 30 * 60 * 1000))
            .populate({
                path: 'questions.question',
                model: 'Question',
            })

        if (!quiz) {
            res.status(200).json({
                active: false,
                error: {
                    message:
                        'Predviđeno vrijeme za igranje kviza je isteklo. Ostvareni rezultat biće sačuvan. Počnite ponovo.',
                },
            })
            return
        } else if (!quiz.active) {
            res.status(200).json({
                active: false,
                error: {
                    message: 'Kviz je završen. Počnite ponovo.',
                },
            })
            return
        } else {
            const isNotAnswered = (question) => question.isAnswered === false
            const questions = quiz.questions.filter(isNotAnswered)
            const num = quiz.questions.findIndex(isNotAnswered) + 1
            if (continuing) {
                let answers = [
                    questions[0].correct,
                    questions[0].answer1,
                    questions[0].answer2,
                    questions[0].answer3,
                ]
                answers = shuffle(answers)

                res.status(200).json({
                    timeRemaining: Math.floor(
                        (quiz.createdAt -
                            Number(new Date(Date.now() - 30 * 60 * 1000))) /
                            1000
                    ),
                    question: {
                        id: questions[0]._id,
                        text: questions[0].text,
                        answers,
                        points: questions[0].points,
                        num,
                    },
                    score: quiz.score,
                    active: true,
                })
            } else {
                const correct = ans === questions[0].question.correct

                quiz.score = correct
                    ? quiz.score + questions[0].question.points
                    : quiz.score
                quiz.questions[
                    quiz.questions.indexOf(questions[0])
                ].isAnsweredCorrectly = correct
                quiz.questions[
                    quiz.questions.indexOf(questions[0])
                ].isAnswered = true

                const question = await Question.findOne({
                    _id: questions[0].question,
                })

                if (correct) {
                    question.answeredCorrectly = question.answeredCorrectly + 1
                } else {
                    question.answeredIncorrectly =
                        question.answeredIncorrectly + 1
                }

                await question.save()

                await quiz.save()

                if (questions[1]) {
                    let answers = [
                        questions[1].question.correct,
                        questions[1].question.answer1,
                        questions[1].question.answer2,
                        questions[1].question.answer3,
                    ]
                    answers = shuffle(answers)

                    res.status(201).json({
                        question: {
                            id: questions[1].question._id,
                            text: questions[1].question.text,
                            answers,
                            points: questions[1].question.points,
                            num,
                        },
                        correct: questions[0].question.correct,
                        score: quiz.score,
                        incorrect: !correct,
                        gameover: false,
                        active: true,
                    })
                } else {
                    quiz.active = false
                    await quiz.save()

                    res.status(200).json({
                        message: 'Stigli ste do kraja kviza. Čestitamo!',
                        active: true,
                        gameover: true,
                        score: quiz.score,
                        incorrect: !correct,
                    })
                }
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Greška na serveru. Pokušajte ponovo.',
        })
    }
}

exports.deleteUserGames = (req, res, next) => {
    const userId = req.params.userId
    Quiz.deleteMany({ takenBy: userId }).then((result) => {
        res.json({ message: 'Deleted successfully' })
    })
}

// exports.theMostSuccessfulQuestions = (req, res, next) => {
//   Question.find()
//     .sort({ answeredCorrectly: -1 })
//     .where("answeredCorrectly")
//     .gt(0)
//     .limit(10)
//     .then((questions) => {
//       res.json(questions);
//     });
// };

// exports.theMostUnsuccessfulQuestions = (req, res, next) => {
//   Question.find()
//     .sort({ answeredIncorrectly: -1 })
//     .where("answeredIncorrectly")
//     .gt(0)
//     .limit(10)
//     .then((questions) => {
//       res.json(questions);
//     });
// };

// exports.getUserNumOfGames = (req, res, next) => {
//   Quiz.aggregate(
//     [
//       {
//         $match: { score: { $gte: 0 } },
//       },
//       {
//         $project: { _id: 1, takenBy: 1, score: 1 },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "takenBy",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $group: {
//           _id: {
//             userId: "$user._id",
//             fullName: "$user.fullName",
//             isWinner: "$user.isWinner",
//           },
//           score: { $sum: 1 },
//         },
//       },
//       { $sort: { score: -1 } },
//     ],
//     (err, result) => {
//       let quizPlayed = 0;
//       const users = result.map((obj) => {
//         quizPlayed = quizPlayed + obj.score;
//         const data = {
//           userId: obj._id.userId[0],
//           fullName: obj._id.fullName[0],
//           isWinner: obj._id.isWinner[0],
//           numOfGames: obj.score,
//         };
//         return data;
//       });

//       res.json({
//         users: users,
//         quizPlayed: quizPlayed,
//       });
//     }
//   );
// };

// exports.numOfGames = (req, res, next) => {
//   Quiz.aggregate(
//     [
//       {
//         $match: { score: { $gte: 0 } },
//       },
//       {
//         $project: { _id: 1, takenBy: 1, score: 1 },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "takenBy",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $group: {
//           _id: { userId: "$user._id", fullName: "$user.fullName" },
//           score: { $sum: 1 },
//         },
//       },
//       { $sort: { score: -1 } },
//     ],
//     (err, result) => {
//       let quizPlayed = 0;
//       result.forEach((obj) => {
//         quizPlayed = quizPlayed + obj.score;
//       });

//       quizPlayed = quizPlayed + 25000; // Because I deleted 25000 quizzes

//       res.json({
//         quizPlayed: quizPlayed,
//       });
//     }
//   );
// };

// exports.activeGames = (req, res, next) => {
//   const time = new Date(Date.now() - 30 * 60 * 1000);
//   Quiz.aggregate(
//     [
//       {
//         $match: { createdAt: { $gt: time }, active: true },
//       },
//       {
//         $project: { _id: 1, takenBy: 1, score: 1 },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "takenBy",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $group: {
//           _id: { userId: "$user._id", fullName: "$user.fullName" },
//           score: { $sum: 1 },
//         },
//       },
//       { $sort: { score: -1 } },
//     ],
//     (err, result) => {
//       let activeGames = 0;
//       result.forEach((obj) => {
//         activeGames = activeGames + obj.score;
//       });

//       res.json({
//         activeGames: activeGames,
//       });
//     }
//   );
// };

// exports.resetQuestionInfo = (req, res, next) => {
//   Question.find().then((questions) => {
//     questions.forEach((question) => {
//       question.answeredCorrectly = 0;
//       question.answeredIncorrectly = 0;
//       question.save();
//     });
//     res.json({ reset: "Reset successful" });
//   });
// };

// exports.changeQuestionsPoints = (req, res, next) => {
//   Question.find().then((questions) => {
//     let changes = 0;
//     questions.forEach((question) => {
//       if (question.points === 5) {
//         question.points = 10;
//         question.save();
//         changes = changes + 1;
//       } else if (question.points === 8) {
//         question.points = 15;
//         question.save();
//         changes = changes + 1;
//       } else if (question.points === 10) {
//         question.points = 20;
//         question.save();
//         changes = changes + 1;
//       }
//     });
//     res.json({
//       successfulChanges: changes,
//     });
//   });
// };
