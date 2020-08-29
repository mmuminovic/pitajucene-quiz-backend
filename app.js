const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const compression = require('compression')
// const morgan = require("morgan");
const cors = require('cors')
const {
    quizRoutes,
    userRoutes,
    reportsRoutes,
    quoteRoutes,
    statsRoutes,
    questionRoutes,
} = require('./src/routes')

require('dotenv').config()

const MONGODB_URI = `${process.env.MONGODB_URI}`
app.use(cors())

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(helmet())
app.use(compression())
// app.use(morgan('combined'));

app.use('/quiz', quizRoutes)
app.use('/user', userRoutes)
app.use('/reports', reportsRoutes)
app.use('/quotes', quoteRoutes)
app.use('/question', questionRoutes)
app.use('/stats', statsRoutes)

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    .then((result) => {
        app.listen(process.env.PORT || 8080)
    })
