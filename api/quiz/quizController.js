const mongoose = require('mongoose');
const { shuffle } = require('../shuffle');
const Question = require('./questionModel');
const Quiz = require('./quizModel');
const User = require('../user/userModel');
const { validationResult } = require('express-validator');

exports.createQuizQuestions = (req, res, next) => {
    const userId = req.body.userId;
    Question
        .find()
        .then(result => {
            let allQuestions = [];
            let pitanja5 = [], pitanja8 = [], pitanja10 = [];
            for (let i of result) {
                if (i.points === 5) {
                    pitanja5.push(i);
                } else if (i.points === 8) {
                    pitanja8.push(i);
                } else if (i.points === 10) {
                    pitanja10.push(i);
                }
            }
            pitanja5 = shuffle(pitanja5).slice(0, 20);
            pitanja8 = shuffle(pitanja8).slice(0, 20);
            pitanja10 = shuffle(pitanja10).slice(0, 20);
            allQuestions = [...pitanja5, ...pitanja8, ...pitanja10];

            let questionIds = allQuestions.map(q => {
                const data = { question: q._id };
                return data;
            });

            let answers = [allQuestions[0].correct, allQuestions[0].answer1, allQuestions[0].answer2, allQuestions[0].answer3];
            answers = shuffle(answers);

            const quizQuestions = new Quiz({
                _id: new mongoose.Types.ObjectId(),
                takenBy: userId,
                questions: [...questionIds]
            });
            quizQuestions.save()
                .then(result => {
                    res.status(200).json({
                        quiz: result._id,
                        firstQuestion: {
                            id: allQuestions[0]._id,
                            text: allQuestions[0].text,
                            answer0: answers[0],
                            answer1: answers[1],
                            answer2: answers[2],
                            answer3: answers[3],
                            link: allQuestions[0].link,
                            points: allQuestions[0].points
                        }
                    });
                });

        });
}

exports.startQuiz = (req, res, next) => {
    const quizId = req.params.quizId;
    const ans = req.body.answer;
    const continuing = req.body.continuing ? req.body.continuing : false;

    Quiz
        .findOne({ _id: quizId })
        .where('createdAt').gt(new Date(Date.now() - 30 * 60 * 1000))
        .populate({
            path: 'questions.question',
            model: 'Question'
        })
        .then(quiz => {
            if (!quiz) {
                res.json({
                    message: 'Predviđeno vreme za igranje kviza je isteklo. Ostvareni rezultat biće sačuvan. Počnite ponovo.',
                    gameover: true
                });
            } else if (!quiz.active) {
                res.json({
                    message: 'Kviz je završen. Počnite ponovo.',
                    gameover: true
                });
            } else if (quiz.active && continuing) {
                const q = quiz.questions.find(question => !question.isAnswered && !question.isAnsweredCorrectly);
                let answers = [q.question.correct, q.question.answer1, q.question.answer2, q.question.answer3];
                answers = shuffle(answers);

                // const a = new Date(quiz.createdAt);
                // const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                // const year = a.getFullYear();
                // const month = months[a.getMonth()];
                // const date = a.getDate();
                // let hour = a.getHours();
                // if (hour.toString().length == 1) {
                //     hour = "0" + hour;
                // }
                // let min = a.getMinutes();
                // if (min.toString().length == 1) {
                //     min = "0" + min;
                // }
                // let sec = a.getSeconds();
                // if (sec.toString().length == 1) {
                //     sec = "0" + sec;
                // }
                // const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;

                res.json({
                    timeRemaining: Math.floor((quiz.createdAt - new Date(Date.now() - 30 * 60 * 1000)) / 1000),
                    question: {
                        id: q.question._id,
                        text: q.question.text,
                        answer0: answers[0],
                        answer1: answers[1],
                        answer2: answers[2],
                        answer3: answers[3],
                        link: q.question.link,
                        points: q.question.points
                    },
                    score: quiz.score,
                    gameover: false
                });
            } else {
                let questions = quiz.questions.filter(question => question.isAnswered === false);

                if (ans === questions[0].question.correct) {
                    quiz.score = quiz.score + questions[0].question.points;
                    quiz.questions[quiz.questions.indexOf(questions[0])].isAnsweredCorrectly = true;
                    quiz.questions[quiz.questions.indexOf(questions[0])].isAnswered = true;
                    Question.findOne({ _id: questions[0].question }).then(question => {
                        question.answeredCorrectly = question.answeredCorrectly + 1;
                        question.save();
                    });
                    quiz.save().then(result => {
                        if (questions[1]) {
                            let answers = [questions[1].question.correct, questions[1].question.answer1, questions[1].question.answer2, questions[1].question.answer3];
                            answers = shuffle(answers);
                            res.json({
                                question: {
                                    id: questions[1].question._id,
                                    text: questions[1].question.text,
                                    answer0: answers[0],
                                    answer1: answers[1],
                                    answer2: answers[2],
                                    answer3: answers[3],
                                    link: questions[1].question.link,
                                    points: questions[1].question.points
                                },
                                score: quiz.score,
                                gameover: false
                            });
                        } else {
                            quiz.active = false;
                            quiz.save().then(result => {
                                res.json({
                                    message: 'Stigli ste do kraja kviza. Čestitamo!',
                                    finished: true,
                                    gameover: true,
                                    score: quiz.score
                                });
                            });
                        }
                    })
                }
                else {
                    Question.findOne({ _id: questions[0].question })
                        .then(question => {
                            question.answeredIncorrectly = question.answeredIncorrectly + 1;
                            question.save();
                        });
                    quiz.active = false;
                    quiz.questions[quiz.questions.indexOf(questions[0])].isAnsweredCorrectly = false;
                    quiz.questions[quiz.questions.indexOf(questions[0])].isAnswered = true;
                    quiz.save().then(result => {
                        res.json({
                            message: 'Netačan odgovor!',
                            incorrect: true,
                            score: quiz.score
                        });
                    })
                }
            }
        });

}


exports.deleteUserGames = (req, res, next) => {
    const userId = req.params.userId;
    Quiz.deleteMany({ takenBy: userId })
        .then(result => {
            res.json({ message: 'Delete successful' });
        })
}

exports.getMyScore = (req, res, next) => {
    const userId = req.params.userId;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    Quiz
        .find({ takenBy: userId })
        .sort({ score: -1 })
        .where('updatedAt').lt(lastDay).gt(firstDay)
        .limit(1)
        .then(result => {
            if (result.length === 0) {
                res.json({ score: 0 });
            } else {
                res.json({ score: result[0].score });
            }
        });
}

exports.getMyBestScore = (req, res, next) => {
    const userId = req.params.userId;
    Quiz
        .find({ takenBy: userId })
        .sort({ score: -1 })
        .limit(1)
        .then(result => {
            if (result.length === 0) {
                res.json({ score: 0 });
            } else {
                res.json({ score: result[0].score });
            }
        });
}

exports.scoreLastMonth = (req, res, next) => {
    const userId = req.params.userId;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    Quiz
        .find({ takenBy: userId })
        .sort({ score: -1 })
        .where('updatedAt').lt(lastDay).gt(firstDay)
        .limit(1)
        .then(result => {
            if (result.length === 0) {
                res.json({ score: 0 });
            } else {
                res.json({ score: result[0].score });
            }
        });
}

// RANKING LIST
exports.getRankingList = (req, res, next) => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    Quiz.aggregate([
        {
            $match: { score: { $gt: 0 }, updatedAt: { $gt: firstDay, $lt: lastDay } }
        },
        { $sort: { score: -1, updatedAt: -1 } },
        {
            $group: { _id: { takenBy: "$takenBy" }, score: { $max: "$score" }, updatedAt: { $first: "$updatedAt" } }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $lookup: { from: 'users', localField: '_id.takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $sort: { score: -1 }
        }
        // {
        //     $group:
        //     {
        //         _id: { userId: "$user._id", fullName: "$user.fullName", updatedAt: { $first: "$updatedAt" } },
        //         score: { $max: "$score" }
        //     }
        // },
    ], (err, result) => {
        const ranking = result.map((obj, i) => {
            const data = {
                userId: obj.user[0]._id,
                fullName: obj.user[0].fullName,
                score: obj.score
            };
            return data;
        })
        res.json(ranking.slice(0, 20));
        // res.json(result);
    });
    // const date = new Date();
    // const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    // Quiz
    //     .find()
    //     .sort({ score: -1 })
    //     .where('updatedAt').lt(lastDay).gt(firstDay)
    //     .where('score').gt(0)
    //     .populate('takenBy')
    //     .limit(10)
    //     .then(result => {
    //         const list = result.map(quiz => {
    //             let userData = {
    //                 userId: quiz.takenBy._id,
    //                 fullName: quiz.takenBy.fullName,
    //                 score: quiz.score
    //             }
    //             return userData;
    //         });
    //         res.json(list);
    //     });
}

exports.getLastMonthList = (req, res, next) => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    Quiz.aggregate([
        {
            $match: { score: { $gt: 0 }, updatedAt: { $gt: firstDay, $lt: lastDay } }
        },
        { $sort: { score: -1, updatedAt: -1 } },
        {
            $group: { _id: { takenBy: "$takenBy" }, score: { $max: "$score" }, updatedAt: { $first: "$updatedAt" } }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $lookup: { from: 'users', localField: '_id.takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $sort: { score: -1 }
        }
    ], (err, result) => {
        const ranking = result.map(obj => {
            const data = {
                userId: obj.user[0]._id,
                fullName: obj.user[0].fullName,
                score: obj.score
            };
            return data;
        })
        res.json(ranking.slice(0, 10));
    });

    // const date = new Date();
    // const firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    // const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    // Quiz
    //     .find()
    //     .sort({ score: -1 })
    //     .where('updatedAt').lt(lastDay).gt(firstDay)
    //     .where('score').gt(0)
    //     .populate('takenBy')
    //     .limit(10)
    //     .then(result => {
    //         const users = result.map(quiz => {
    //             let userData = {
    //                 userId: quiz.takenBy._id,
    //                 fullName: quiz.takenBy.fullName,
    //                 score: quiz.score
    //             }
    //             return userData;
    //         });
    //         res.json(users);
    //     });
}

exports.getTheBestRecords = (req, res, next) => {
    Quiz.aggregate([
        {
            $match: { score: { $gt: 0 } }
        },
        { $sort: { score: -1, updatedAt: -1 } },
        {
            $group: { _id: { takenBy: "$takenBy" }, score: { $max: "$score" }, updatedAt: { $first: "$updatedAt" } }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $lookup: { from: 'users', localField: '_id.takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $sort: { score: -1 }
        }
    ], (err, result) => {
        const ranking = result.map(obj => {
            const data = {
                userId: obj.user[0]._id,
                fullName: obj.user[0].fullName,
                score: obj.score
            };
            return data;
        })
        res.json(ranking.slice(0, 10));
    });
    // Quiz
    //     .find()
    //     .sort({ score: -1 })
    //     .where('score').gt(0)
    //     .populate('takenBy')
    //     .limit(10)
    //     .then(result => {
    //         const users = result.map(quiz => {
    //             let userData = {
    //                 userId: quiz.takenBy._id,
    //                 fullName: quiz.takenBy.fullName,
    //                 score: quiz.score
    //             }
    //             return userData;
    //         });
    //         res.json(users);
    //     });
}

exports.getQuestionsByCondition = (req, res, next) => {
    let { condition, sortBy } = req.body;
    Question
        .find(condition)
        .sort([[sortBy, -1]])
        .then(result => {
            res.json(result);
        })
}

exports.addQuestion = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 500;
        error.data = errors.array();
        return res.json({ error: error.data[0].msg });
    }
    const newQuestion = new Question({
        _id: new mongoose.Types.ObjectId(),
        text: req.body.text,
        answer1: req.body.answer1,
        answer2: req.body.answer2,
        answer3: req.body.answer3,
        correct: req.body.correct,
        link: req.body.link,
        points: req.body.points
    });
    newQuestion.save().then(result => {
        res.json(result)
    });
}

exports.editQustion = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 500;
        error.data = errors.array();
        return res.json({ error: error.data[0].msg });
    }
    const questionId = req.params.questionId;
    const newData = req.body;
    Question.update({ _id: questionId }, newData).then(result => res.json(result));
}

exports.deleteQuestion = (req, res, next) => {
    const questionId = req.params.questionId;
    Question.deleteOne({ _id: questionId }).then(result => res.json(result))
}

exports.theMostSuccessfulQuestions = (req, res, next) => {
    Question
        .find()
        .sort({ answeredCorrectly: -1 })
        .where('answeredCorrectly').gt(0)
        .limit(10)
        .then(questions => {
            res.json(questions);
        })
}

exports.theMostUnsuccessfulQuestions = (req, res, next) => {
    Question
        .find()
        .sort({ answeredIncorrectly: -1 })
        .where('answeredIncorrectly').gt(0)
        .limit(10)
        .then(questions => {
            res.json(questions);
        })
}

exports.getUserNumOfGames = (req, res, next) => {
    Quiz.aggregate([
        {
            $match: { score: { $gte: 0 } }
        },
        {
            $project: { _id: 1, takenBy: 1, score: 1 }
        },
        {
            $lookup: { from: 'users', localField: 'takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $group:
            {
                _id: { userId: "$user._id", fullName: "$user.fullName" },
                score: { $sum: 1 }
            }
        },
        { $sort: { score: -1 } }
    ], (err, result) => {
        let quizPlayed = 0;
        const users = result.map(obj => {
            quizPlayed = quizPlayed + obj.score;
            const data = {
                userId: obj._id.userId[0],
                fullName: obj._id.fullName[0],
                numOfGames: obj.score
            };
            return data;
        });
        res.json({
            users: users,
            quizPlayed: quizPlayed
        });
    });
}

exports.numOfGames = (req, res, next) => {
    Quiz.aggregate([
        {
            $match: { score: { $gte: 0 } }
        },
        {
            $project: { _id: 1, takenBy: 1, score: 1 }
        },
        {
            $lookup: { from: 'users', localField: 'takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $group:
            {
                _id: { userId: "$user._id", fullName: "$user.fullName" },
                score: { $sum: 1 }
            }
        },
        { $sort: { score: -1 } }
    ], (err, result) => {
        let quizPlayed = 0;
        result.forEach(obj => {
            quizPlayed = quizPlayed + obj.score;
        });

        res.json({
            quizPlayed: quizPlayed
        });
    });
}

exports.activeGames = (req, res, next) => {
    const time = new Date(Date.now() - 30 * 60 * 1000);
    Quiz.aggregate([
        {
            $match: { createdAt: { $gt: time }, active: true }
        },
        {
            $project: { _id: 1, takenBy: 1, score: 1 }
        },
        {
            $lookup: { from: 'users', localField: 'takenBy', foreignField: '_id', as: 'user' }
        },
        {
            $group:
            {
                _id: { userId: "$user._id", fullName: "$user.fullName" },
                score: { $sum: 1 }
            }
        },
        { $sort: { score: -1 } }
    ], (err, result) => {
        let activeGames = 0;
        result.forEach(obj => {
            activeGames = activeGames + obj.score;
        });

        res.json({
            activeGames: activeGames
        });
    });
}

exports.resetQuestionInfo = (req, res, next) => {
    Question
        .find()
        .then(questions => {
            questions.forEach(question => {
                question.answeredCorrectly = 0;
                question.answeredIncorrectly = 0;
                question.save();
            })
            res.json({ reset: 'Reset successful' });
        })
}