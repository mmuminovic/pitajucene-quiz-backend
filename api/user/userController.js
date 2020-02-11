const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const schedule = require('node-schedule');
const Quiz = require('../quiz/quizModel');
const User = require('./userModel');
const { validationResult } = require('express-validator');

// Login
exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.data = errors.array();
        return res.json({ message: error.data[0].msg });
    }
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.json({
                    message: 'Neispravan email ili šifra'
                });
            }
            loadedUser = user;
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    return res.json({
                        message: 'Neispravan email ili šifra'
                    });
                }
                if (result) {
                    const token = jwt.sign({
                        email: loadedUser.email,
                        userId: loadedUser._id.toString(),
                        fullName: loadedUser.fullName,
                        isAdmin: loadedUser.isAdmin
                    }, process.env.JWT_KEY, { expiresIn: '1d' }
                    );
                    // console.log(loadedUser);
                    // res.cookie('access_token', token, {
                    //     httpOnly: true
                    // });
                    return res.status(200).json({
                        success: 'Auth successful',
                        token: token,
                        userId: loadedUser._id.toString()
                    });
                } else {
                    return res.json({
                        message: 'Neispravan email ili šifra'
                    });
                }
            });
        })
};

// Signup
exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        return res.json({ error: error.data[0].msg });
    }
    const email = req.body.email;
    const fullName = req.body.fullName;
    const password = req.body.password;
    let isAdmin = false;
    if (req.body.isAdmin === `${process.env.ADMIN_KEY}`) {
        isAdmin = true;
    }
    bcrypt
        .hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                _id: mongoose.Types.ObjectId(),
                email: email,
                password: hashedPw,
                fullName: fullName,
                isAdmin: isAdmin,
                currentScore: 0
            });
            return user.save();
        })
        .then(result => {
            res.status(201).json({ message: 'User created!', userId: result._id });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Get All Users
exports.allUsers = (req, res, next) => {
    User
        .find()
        .sort({ fullName: 1 })
        .then(result => {
            const users = result.map(user => {
                return { userId: user._id, fullName: user.fullName }
            });
            res.json(users);
        });
}

// Edit user
exports.editUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.data = errors.array();
        return res.json({ error: error.data[0].msg });
    }

    const { password } = req.body;
    const userId = req.params.userId;
    bcrypt
        .hash(password, 12)
        .then(hashedPw => {
            User.findOne({ _id: userId })
                .then(user => {
                    user.password = hashedPw;
                    user.save().then(result => {
                        res.json({ message: 'Šifra uspešno promijenjena.' })
                    });
                });
        })
}

exports.deleteUser = (req, res, next) => {
    const userId = req.params.userId;
    User.deleteOne({ _id: userId }).then(result => res.json(result))
}

// Get user's info
exports.getUserInfo = (req, res, next) => {
    const userId = req.params.userId;
    User
        .findById(userId)
        .then(user => {
            const userData = {
                email: user.email,
                fullName: user.fullName
            };
            Quiz
                .find({ takenBy: userId })
                .sort({ updatedAt: -1 })
                .populate({
                    path: 'questions.question',
                    model: 'Question'
                })
                .then(result => {
                    const quiz = result.map(obj => {
                        const a = new Date(obj.updatedAt);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const year = a.getFullYear();
                        const month = months[a.getMonth()];
                        const date = a.getDate();
                        let hour = a.getHours();
                        if (hour.toString().length == 1) {
                            hour = "0" + hour;
                        }
                        let min = a.getMinutes();
                        if (min.toString().length == 1) {
                            min = "0" + min;
                        }
                        let sec = a.getSeconds();
                        if (sec.toString().length == 1) {
                            sec = "0" + sec;
                        }
                        const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
                        let selectedQuestion = {};
                        let incorrect = false;
                        let wrongAnswer = obj.questions.find(q => q.isAnswered && !q.isAnsweredCorrectly && q.question);
                        if (wrongAnswer) {
                            Object.assign(selectedQuestion, {
                                questionText: wrongAnswer.question.text,
                                questionLink: wrongAnswer.question.link
                            });
                            incorrect = true;
                        }
                        let timeIsUp;
                        if (Math.floor((obj.createdAt - new Date(Date.now() - 10 * 60 * 1000)) / 1000) > 0 && obj.active) {
                            timeIsUp = false;
                            Object.assign(selectedQuestion, {
                                questionText: 'Ovaj kviz nije završen. Možete ga nastaviti pritiskom na dugme ispod.',
                                questionLink: obj._id
                            });
                        } else if (Math.floor((obj.createdAt - new Date(Date.now() - 10 * 60 * 1000)) / 1000) <= 0 && obj.active) {
                            timeIsUp = true;
                            Object.assign(selectedQuestion, {
                                questionText: 'Niste završili kviz. Predviđeno vrijeme za igranje kviza je isteklo.',
                                questionLink: 'Time is up.'
                            });
                        } else {
                            timeIsUp = true;
                        }

                        Object.assign(selectedQuestion, {
                            time: time,
                            score: obj.score,
                            incorrect: incorrect,
                            timeIsUp: timeIsUp
                        });

                        return selectedQuestion;
                    });

                    res.json({
                        user: userData,
                        quiz: quiz,
                        numOfGames: result.length
                    })
                })
        })
}



