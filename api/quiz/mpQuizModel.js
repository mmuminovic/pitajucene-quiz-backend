const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mpQuizSchema = new Schema({
    _id: Schema.Types.ObjectId,
    players: [{
        player: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    questions: [{
        question: {
            type: Schema.Types.ObjectId,
            ref: 'Question'
        },
        isAnswered: { type: Boolean, default: false },
        skipped: {
            type: Boolean, 
            default: false
        },
        answeredBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    score1: {
        type: Number,
        default: 0
    },
    score2: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Multiplayer', mpQuizSchema);