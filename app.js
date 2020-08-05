const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
// const morgan = require("morgan");
const cors = require("cors");
const quizRoutes = require("./src/routes/quiz");
const userRoutes = require("./src/routes/user");
const reportsRoutes = require("./src/routes/reports");
const quoteRoutes = require("./src/routes/quotes");
require("dotenv").config();

const MONGODB_URI = `${process.env.MONGODB_URI}`;

app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helmet());
app.use(compression());
// app.use(morgan('combined'));

app.use(quizRoutes);
app.use(userRoutes);
app.use(reportsRoutes);
app.use("/quotes", quoteRoutes);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || 8080);
  });
