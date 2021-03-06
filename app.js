const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const cors = require('cors')
const {
    quizRoutes,
    userRoutes,
    reportsRoutes,
    quoteRoutes,
    statsRoutes,
    questionRoutes,
} = require('./src/routes')
const rfs = require('rotating-file-stream')

// create a rotating write stream
const stream = rfs.createStream('access.log', {
    interval: '1d',
    path: __dirname,
})

require('dotenv').config()

const MONGODB_URI = `${process.env.MONGODB_URI}`

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use(
    morgan('combined', {
        stream,
        skip: function (req, res) {
            return res.statusCode < 400
        },
    })
)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(helmet())
app.use(compression())
// app.use(morgan('combined'));

app.use(cors({ origin: '*' }))

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
    .then(() => {
        app.listen(process.env.PORT || 8080)
    })
