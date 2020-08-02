const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    _id: Schema.Types.ObjectId,
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedQuestion: String,
    questionId: String,
    message: {
        type: String,
        required: true
    },
    answer: String,
    solved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);