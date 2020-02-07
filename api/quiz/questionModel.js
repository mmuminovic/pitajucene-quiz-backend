const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    _id: Schema.Types.ObjectId,
    text: String,
    correct: String,
    answer1: String,
    answer2: String,
    answer3: String,
    points: Number,
    link: String,
    answeredCorrectly: {
        type: Number,
        default: 0
    },
    answeredIncorrectly: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);