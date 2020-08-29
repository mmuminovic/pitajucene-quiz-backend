const mongoose = require('mongoose')
const Quote = require('../models/quote')
const { shuffle } = require('../utils/shuffle')

exports.getAllQuotes = (req, res, next) => {
    Quote.find().then((quotes) => {
        if (quotes.length === 0) {
            res.json(quotes)
        } else {
            const data = quotes.map((el) => {
                let likes = el.likedBy.length
                let quote
                quote = {
                    quoteId: el._id,
                    quoteText: el.quoteText,
                    quoteAuthor: el.quoteAuthor,
                    quoteSource: el.quoteSource,
                    likes: likes,
                }
                return quote
            })
            res.json(data)
        }
    })
}

exports.getQuote = (req, res, next) => {
    const quoteId = req.params.quoteId
    Quote.findOne({ _id: quoteId }).then((quote) => {
        let likes = quote.likedBy.length
        res.json({
            quoteText: quote.quoteText,
            quoteAuthor: quote.quoteAuthor,
            quoteSource: quote.quoteSource,
            likes: likes,
        })
    })
}

exports.getRandomQuote = (req, res, next) => {
    const userId = req.query.userId
    Quote.find().then((quotes) => {
        if (quotes.length === 0) {
            let quote = {
                quoteId: null,
                quoteText: null,
                quoteAuthor: null,
                quoteSource: null,
                likes: 0,
                likedByMe: false,
            }
            res.json(quote)
        } else {
            let shuffledQuotes = shuffle(quotes)
            let likes = shuffledQuotes[0].likedBy.length
            let likedByMe
            if (shuffledQuotes[0].likedBy.length === 0) {
                likedByMe = false
            } else if (
                shuffledQuotes[0].likedBy.some((e) => {
                    if (e.user) {
                        return e.user.toString() === userId
                    } else {
                        return false
                    }
                })
            ) {
                likedByMe = true
            } else {
                likedByMe = false
            }

            let quote = {
                quoteId: shuffledQuotes[0]._id,
                quoteText: shuffledQuotes[0].quoteText,
                quoteAuthor: shuffledQuotes[0].quoteAuthor,
                quoteSource: shuffledQuotes[0].quoteSource,
                likes: likes,
                likedByMe: likedByMe,
            }
            res.json(quote)
        }
    })
}

exports.addQuote = (req, res, next) => {
    const newQuote = new Quote({
        _id: mongoose.Types.ObjectId(),
        quoteText: req.body.quoteText,
        quoteAuthor: req.body.quoteAuthor,
        quoteSource: req.body.quoteSource,
    })

    newQuote.save().then((result) => {
        res.json(result)
    })
}

exports.likeQuote = (req, res, next) => {
    const quoteId = req.params.quoteId
    const userId = req.body.userId

    Quote.findOne({ _id: quoteId }).then((quote) => {
        if (quote.likedBy.length === 0) {
            quote.likedBy.push({ user: userId })
            quote.save()
        } else if (
            quote.likedBy.some((e) => {
                if (e.user) {
                    return e.user.toString() === userId
                }
            })
        ) {
            res.json({ message: 'Status je već lajkovan.' })
        } else {
            quote.likedBy.push({ user: userId })
            quote.save()
        }
    })
}

exports.editQuote = (req, res, next) => {
    const quoteId = req.params.quoteId
    const newData = req.body
    Quote.updateOne({ _id: quoteId }, newData).then((result) =>
        res.json(result)
    )
}

exports.deleteQuote = (req, res, next) => {
    const quoteId = req.params.quoteId
    Quote.deleteOne({ _id: quoteId }).then((result) => res.json(result))
}
