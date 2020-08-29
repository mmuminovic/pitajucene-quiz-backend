const mongoose = require('mongoose')

const Schema = mongoose.Schema

const quizSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        takenBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        questions: [
            {
                question: {
                    type: Schema.Types.ObjectId,
                    ref: 'Question',
                },
                isAnswered: { type: Boolean, default: false },
                isAnsweredCorrectly: { type: Boolean, default: false },
            },
        ],
        score: {
            type: Number,
            default: 0,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Quiz', quizSchema)
