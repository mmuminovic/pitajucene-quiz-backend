const mongoose = require('mongoose')

const Schema = mongoose.Schema

const quoteSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        quoteText: String,
        quoteAuthor: String,
        quoteSource: String,
        likedBy: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
    },
    { timestamps: true }
)

module.exports = mongoose.model('Quote', quoteSchema)
