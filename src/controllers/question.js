const { validationResult } = require('express-validator')
const Question = require('../models/question')

exports.getQuestions = async (req, res, next) => {
    let { condition, sortBy } = req.query
    try {
        const result = await Question.find(condition).sort([[sortBy, -1]])
        res.json(result)
    } catch (error) {
        res.status(500).json({ error })
    }
}

exports.addQuestion = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.')
        error.statusCode = 500
        error.data = errors.array()
        return res.json({ error: error.data[0].msg })
    }
    const newQuestion = new Question({
        _id: new mongoose.Types.ObjectId(),
        text: req.body.text,
        answer1: req.body.answer1,
        answer2: req.body.answer2,
        answer3: req.body.answer3,
        correct: req.body.correct,
        link: req.body.link,
        points: req.body.points,
    })
    try {
        const result = await newQuestion.save()
        res.json(result)
    } catch (error) {
        res.status(500).json({ error })
    }
}

exports.editQustion = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.')
        error.statusCode = 500
        error.data = errors.array()
        return res.json({ error: error.data[0].msg })
    }
    const questionId = req.params.questionId
    const newData = req.body
    try {
        const result = await Question.updateOne({ _id: questionId }, newData)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error })
    }
}

exports.deleteQuestion = async (req, res, next) => {
    const questionId = req.params.questionId
    try {
        const result = await Question.deleteOne({ _id: questionId })
        res.json(result)
    } catch (error) {
        res.status(500).json({ error })
    }
}
