const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const schedule = require('node-schedule');
const questionRoutes = require('./api/quiz/quizRoutes');
const userRoutes = require('./api/user/userRoutes');
const reportsRoutes = require('./api/reports/reportsRouter');

const MONGODB_URI = `${process.env.MONGOLAB_RED_URI}`;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE',
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helmet());
app.use(compression());
// app.use(morgan('combined'));

app.use(questionRoutes);
app.use(userRoutes);
app.use(reportsRoutes);

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(result => {
        app.listen(process.env.PORT || 8080);
    });