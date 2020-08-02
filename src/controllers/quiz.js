const mongoose = require("mongoose");

const { shuffle } = require("../utils/shuffle");
const Question = require("../models/question");
const Quiz = require("../models/quiz");
const User = require("../models/user");

const { validationResult } = require("express-validator");

exports.createQuizQuestions = async (req, res, next) => {
  const userId = req.body.userId;
  try {
    const questions = await Question.find();
    let allQuestions = [];
    let pitanja1 = [],
      pitanja2 = [],
      pitanja3 = [];
    questions.forEach((item) => {
      if (item.points === 10) {
        pitanja1.push(item);
      } else if (item.points === 15) {
        pitanja2.push(item);
      } else if (item.points === 20) {
        pitanja3.push(item);
      }
    });

    allQuestions = [
      ...shuffle(pitanja1).slice(0, 20),
      ...shuffle(pitanja2).slice(0, 20),
      ...shuffle(pitanja3).slice(0, 20),
    ];

    let questionIds = allQuestions.map((q) => {
      const data = { question: q._id };
      return data;
    });

    let answers = [
      allQuestions[0].correct,
      allQuestions[0].answer1,
      allQuestions[0].answer2,
      allQuestions[0].answer3,
    ];
    answers = shuffle(answers);

    const quizQuestions = new Quiz({
      _id: new mongoose.Types.ObjectId(),
      takenBy: userId,
      questions: [...questionIds],
    });

    const newQuiz = await quizQuestions.save();

    res.status(201).json({
      quiz: newQuiz._id,
      firstQuestion: {
        id: allQuestions[0]._id,
        text: allQuestions[0].text,
        answer0: answers[0],
        answer1: answers[1],
        answer2: answers[2],
        answer3: answers[3],
        points: allQuestions[0].points,
      },
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.startQuiz = async (req, res, next) => {
  const { quizId } = req.params;
  const { answer: ans, continuing: isQuizStarted } = req.body.answer;
  const continuing = isQuizStarted ? true : false;

  const quiz = await Quiz.aggregate([
    {
      $match: {
        _id: quizId,
        createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) },
      },
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        questions: 1,
        takenBy: 1,
        score: 1,
        active: 1,
      },
    },
    {
      $lookup: {
        from: "questions",
        localField: "_id.questions.question",
        foreignField: "_id",
        as: "question",
      },
    },
  ]);

  if (!quiz) {
    response.statusCode = 403;
    response.body = {
      message:
        "Predviđeno vrijeme za igranje kviza je isteklo. Ostvareni rezultat biće sačuvan. Počnite ponovo.",
    };
    return;
  } else if (!quiz.active) {
    response.statusCode = 403;
    response.body = {
      message: "Kviz je završen. Počnite ponovo.",
    };
    return;
  } else if (quiz.active && continuing) {
    const q = quiz.questions.find(
      (question) => !question.isAnswered && !question.isAnsweredCorrectly
    );
    const mappedQuestions = quiz.questions.map((q) => q.question._id);
    const ordinalNumberOfQuestion = mappedQuestions.indexOf(q.question._id) + 1;
    let answers = [
      q.question.correct,
      q.question.answer1,
      q.question.answer2,
      q.question.answer3,
    ];
    answers = shuffle(answers);

    response.body = {
      timeRemaining: Math.floor(
        (quiz.createdAt - Number(new Date(Date.now() - 30 * 60 * 1000))) / 1000
      ),
      question: {
        id: q.question._id,
        text: q.question.text,
        answer0: answers[0],
        answer1: answers[1],
        answer2: answers[2],
        answer3: answers[3],
        points: q.question.points,
        num: ordinalNumberOfQuestion,
      },
      score: quiz.score,
    };
  } else {
    let questions = quiz.questions.filter(
      (question) => question.isAnswered === false
    );

    let correct = ans === questions[0].question.correct;

    quiz.score = correct
      ? quiz.score + questions[0].question.points
      : quiz.score;
    quiz.questions[
      quiz.questions.indexOf(questions[0])
    ].isAnsweredCorrectly = correct;
    quiz.questions[quiz.questions.indexOf(questions[0])].isAnswered = true;

    const question = await Question.findOne({
      _id: questions[0].question,
    });
    if (correct) {
      question.answeredCorrectly = question.answeredCorrectly + 1;
    } else {
      question.answeredIncorrectly = question.answeredIncorrectly + 1;
    }

    await question.save();

    await quiz.save();

    if (questions[1]) {
      let answers = [
        questions[1].question.correct,
        questions[1].question.answer1,
        questions[1].question.answer2,
        questions[1].question.answer3,
      ];
      answers = shuffle(answers);
      res.status(201).json({
        question: {
          id: questions[1].question._id,
          text: questions[1].question.text,
          answer0: answers[0],
          answer1: answers[1],
          answer2: answers[2],
          answer3: answers[3],
          points: questions[1].question.points,
        },
        previousQuestion: {
          correctAnswer: questions[0].question.correct,
          link: questions[0].question.link,
        },
        score: quiz.score,
        incorrect: !correct,
        gameover: false,
      });
    } else {
      quiz.active = false;
      await quiz.save();

      res.status(200).json({
        message: "Stigli ste do kraja kviza. Čestitamo!",
        finished: true,
        gameover: true,
        score: quiz.score,
        incorrect: !correct,
        previousQuestion: {
          correctAnswer: questions[0].question.correct,
          link: questions[0].question.link,
        },
      });
    }
  }
};

exports.deleteUserGames = (req, res, next) => {
  const userId = req.params.userId;
  Quiz.deleteMany({ takenBy: userId }).then((result) => {
    res.json({ message: "Deleted successfully" });
  });
};

// My scores
exports.getMyScores = async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.params.userId);
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  try {
    const result = await Quiz.aggregate([
      {
        $match: {
          takenBy: userId,
          score: { $gt: 0 },
          updatedAt: { $gt: firstDay, $lt: lastDay },
        },
      },
      {
        $sort: { score: -1, updatedAt: -1 },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    const ranking = result.map((obj, i) => {
      let minutes = Math.floor(obj.duration / 60000);
      let seconds = ((obj.duration % 60000) / 1000).toFixed(0);
      if (seconds.length === 1) {
        seconds = `0${seconds}`;
      }
      const data = {
        score: obj.score,
        duration: `${minutes}:${seconds}`,
      };
      return data;
    });

    // The best scores
    const bestScores = await Quiz.aggregate([
      {
        $match: { takenBy: userId, score: { $gt: 0 } },
      },
      {
        $sort: { score: -1, updatedAt: -1 },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    const topRecords = bestScores.map((obj, i) => {
      let minutes = Math.floor(obj.duration / 60000);
      let seconds = ((obj.duration % 60000) / 1000).toFixed(0);
      if (seconds.length === 1) {
        seconds = `0${seconds}`;
      }
      const data = {
        score: obj.score,
        duration: `${minutes}:${seconds}`,
      };
      return data;
    });

    // Last period score
    const firstDayOfLastMonth = new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      1
    );
    const firstDayOfThisMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    );

    const lastMonthScores = await Quiz.aggregate([
      {
        $match: {
          takenBy: userId,
          score: { $gt: 0 },
          updatedAt: {
            $gt: firstDayOfLastMonth,
            $lt: firstDayOfThisMonth,
          },
        },
      },
      {
        $sort: { score: -1, updatedAt: -1 },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    let rankingLastPeriod;
    if (lastMonthScores.length !== 0) {
      rankingLastPeriod = lastMonthScores.map((obj, i) => {
        let minutes = Math.floor(obj.duration / 60000);
        let seconds = ((obj.duration % 60000) / 1000).toFixed(0);
        if (seconds.length === 1) {
          seconds = `0${seconds}`;
        }
        const data = {
          score: obj.score,
          duration: `${minutes}:${seconds}`,
        };
        return data;
      });
    } else {
      rankingLastPeriod = [
        {
          score: 0,
          duration: `0:00`,
        },
      ];
    }

    res.status(200).json({
      score: ranking[0],
      theBestScore: topRecords[0],
      scoreLastMonth: rankingLastPeriod[0],
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// RANKING LIST
exports.getRankingLists = async (req, res, next) => {
  const date = new Date();
  let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  let lastDay = new Date(date.getFullYear(), date.getMonth(), 15);
  if (Date.now() > lastDay) {
    firstDay = new Date(date.getFullYear(), date.getMonth(), 15);
    lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [year1, year2] = [firstDay.getFullYear(), lastDay.getFullYear()];
  const [month1, month2] = [
    months[firstDay.getMonth()],
    months[lastDay.getMonth()],
  ];
  const [day1, day2] = [firstDay.getDate(), lastDay.getDate()];
  const time1 = day1 + " " + month1 + " " + year1;
  const time2 = day2 + " " + month2 + " " + year2;

  const rankingListTitle = `${time1} - ${time2}`;

  try {
    // Ranking list
    const result = await Quiz.aggregate([
      {
        $match: {
          score: { $gt: 0 },
          updatedAt: { $gte: firstDay, $lt: lastDay },
        },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
      {
        $group: {
          _id: { takenBy: "$takenBy" },
          score: { $max: "$score" },
          duration: { $first: "$duration" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    let rankingList = [];
    result.forEach((obj, i) => {
      if (!obj.user[0].isWinner) {
        let minutes = Math.floor(obj.duration / 60000);
        let seconds = ((obj.duration % 60000) / 1000).toFixed(0);
        if (seconds.length === 1) {
          seconds = `0${seconds}`;
        }
        const data = {
          userId: obj.user[0]._id,
          fullName: obj.user[0].fullName,
          score: obj.score,
          duration: `${minutes}:${seconds}`,
        };
        rankingList.push(data);
      }
    });

    // Ranking list of last month
    let rankingLastPeriod;

    const date = new Date();
    let firstDayOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDayOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 15);
    if (Date.now() < lastDayOfLastMonth.getTime()) {
      firstDayOfLastMonth = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        15
      );
      lastDayOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    const [year1, year2] = [
      firstDayOfLastMonth.getFullYear(),
      lastDayOfLastMonth.getFullYear(),
    ];
    const [month1, month2] = [
      months[firstDayOfLastMonth.getMonth()],
      months[lastDayOfLastMonth.getMonth()],
    ];
    const [day1, day2] = [
      firstDayOfLastMonth.getDate(),
      lastDayOfLastMonth.getDate(),
    ];
    const time1 = day1 + " " + month1 + " " + year1;
    const time2 = day2 + " " + month2 + " " + year2;

    const rankingListTitle = `${time1} - ${time2}`;

    const resultLastMonth = await Quiz.aggregate([
      {
        $match: {
          score: { $gt: 0 },
          updatedAt: { $gt: firstDayOfLastMonth, $lt: lastDayOfLastMonth },
        },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
      {
        $group: {
          _id: { takenBy: "$takenBy" },
          score: { $max: "$score" },
          duration: { $first: "$duration" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    const numDaysBetween = (d1, d2) => {
      var diff = Math.abs(d1.getTime() - d2.getTime());
      return diff / (1000 * 60 * 60 * 24);
    };
    let rankingListLastPeriod = [];
    resultLastMonth.forEach((obj, i) => {
      let minutes, seconds, data;
      if (obj.user[0].isWinner) {
        if (numDaysBetween(obj.user[0].updatedAt, lastDayOfLastMonth) < 5) {
          minutes = Math.floor(obj.duration / 60000);
          seconds = ((obj.duration % 60000) / 1000).toFixed(0);
          if (seconds.length === 1) {
            seconds = `0${seconds}`;
          }
          data = {
            userId: obj.user[0]._id,
            fullName: obj.user[0].fullName,
            score: obj.score,
            duration: `${minutes}:${seconds}`,
          };
        }
      } else {
        minutes = Math.floor(obj.duration / 60000);
        seconds = ((obj.duration % 60000) / 1000).toFixed(0);
        if (seconds.length === 1) {
          seconds = `0${seconds}`;
        }
        data = {
          userId: obj.user[0]._id,
          fullName: obj.user[0].fullName,
          score: obj.score,
          duration: `${minutes}:${seconds}`,
        };
      }
      if (data) {
        rankingListLastPeriod.push(data);
      }
    });

    rankingLastPeriod = {
      rankingList: rankingListLastPeriod.slice(0, 10),
      rankingListTitle: rankingListTitle,
    };

    let top10ranking;

    const resultTopTen = await Quiz.aggregate([
      {
        $match: { score: { $gt: 0 } },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
      {
        $group: {
          _id: { takenBy: "$takenBy" },
          score: { $max: "$score" },
          duration: { $first: "$duration" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    const ranking = resultTopTen.map((obj, i) => {
      let minutes = Math.floor(obj.duration / 60000);
      let seconds = (obj.duration % 60000) / 1000;
      if (seconds.toFixed(0).length === 1) {
        seconds = `0${seconds}`;
      }
      const data = {
        userId: obj.user[0]._id,
        fullName: obj.user[0].fullName,
        score: obj.score,
        duration: `${minutes}:${seconds}`,
      };
      return data;
    });

    top10ranking = ranking.slice(0, 10);

    // Today
    let theBestToday;

    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0);
    tomorrow.setMinutes(0);
    tomorrow.setSeconds(0);

    const resultToday = await Quiz.aggregate([
      {
        $match: {
          score: { $gte: 0 },
          updatedAt: { $gt: today },
        },
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          score: 1,
          takenBy: 1,
          duration: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
      {
        $group: {
          _id: { takenBy: "$takenBy" },
          score: { $max: "$score" },
          duration: { $first: "$duration" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $sort: { score: -1, duration: 1 },
      },
    ]);

    const rankingToday = resultToday.map((obj, i) => {
      let minutes = Math.floor(obj.duration / 60000);
      let seconds = ((obj.duration % 60000) / 1000).toFixed(0);
      if (seconds.length === 1) {
        seconds = `0${seconds}`;
      }
      const data = {
        fullName: obj.user[0].fullName,
        score: obj.score,
        duration: `${minutes}:${seconds}`,
      };
      return data;
    });

    theBestToday = rankingToday[0];

    res.status(200).json({
      playedToday: rankingToday.length,
      theBestToday,
      currentRankingList: {
        rankingList: rankingList.slice(0, 20),
        rankingListTitle,
      },
      rankingLastPeriod,
      top10ranking,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.getQuestionsByCondition = async (req, res, next) => {
  let { condition, sortBy } = req.body;
  try {
    const result = await Question.find(condition).sort([[sortBy, -1]]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.addQuestion = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 500;
    error.data = errors.array();
    return res.json({ error: error.data[0].msg });
  }
  const newQuestion = new Question({
    _id: new mongoose.Types.ObjectId(),
    text: req.body.text,
    answer1: req.body.answer1,
    answer2: req.body.answer2,
    answer3: req.body.answer3,
    correct: req.body.correct,
    link: req.body.link,
    points: req.body.points,
  });
  try {
    const result = await newQuestion.save();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.editQustion = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 500;
    error.data = errors.array();
    return res.json({ error: error.data[0].msg });
  }
  const questionId = req.params.questionId;
  const newData = req.body;
  try {
    const result = await Question.updateOne({ _id: questionId }, newData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.deleteQuestion = async (req, res, next) => {
  const questionId = req.params.questionId;
  try {
    const result = await Question.deleteOne({ _id: questionId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.theMostSuccessfulQuestions = (req, res, next) => {
  Question.find()
    .sort({ answeredCorrectly: -1 })
    .where("answeredCorrectly")
    .gt(0)
    .limit(10)
    .then((questions) => {
      res.json(questions);
    });
};

exports.theMostUnsuccessfulQuestions = (req, res, next) => {
  Question.find()
    .sort({ answeredIncorrectly: -1 })
    .where("answeredIncorrectly")
    .gt(0)
    .limit(10)
    .then((questions) => {
      res.json(questions);
    });
};

exports.getUserNumOfGames = (req, res, next) => {
  Quiz.aggregate(
    [
      {
        $match: { score: { $gte: 0 } },
      },
      {
        $project: { _id: 1, takenBy: 1, score: 1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: {
            userId: "$user._id",
            fullName: "$user.fullName",
            isWinner: "$user.isWinner",
          },
          score: { $sum: 1 },
        },
      },
      { $sort: { score: -1 } },
    ],
    (err, result) => {
      let quizPlayed = 0;
      const users = result.map((obj) => {
        quizPlayed = quizPlayed + obj.score;
        const data = {
          userId: obj._id.userId[0],
          fullName: obj._id.fullName[0],
          isWinner: obj._id.isWinner[0],
          numOfGames: obj.score,
        };
        return data;
      });

      res.json({
        users: users,
        quizPlayed: quizPlayed,
      });
    }
  );
};

exports.numOfGames = (req, res, next) => {
  Quiz.aggregate(
    [
      {
        $match: { score: { $gte: 0 } },
      },
      {
        $project: { _id: 1, takenBy: 1, score: 1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: { userId: "$user._id", fullName: "$user.fullName" },
          score: { $sum: 1 },
        },
      },
      { $sort: { score: -1 } },
    ],
    (err, result) => {
      let quizPlayed = 0;
      result.forEach((obj) => {
        quizPlayed = quizPlayed + obj.score;
      });

      quizPlayed = quizPlayed + 25000; // Because I deleted 25000 quizzes

      res.json({
        quizPlayed: quizPlayed,
      });
    }
  );
};

exports.activeGames = (req, res, next) => {
  const time = new Date(Date.now() - 10 * 60 * 1000);
  Quiz.aggregate(
    [
      {
        $match: { createdAt: { $gt: time }, active: true },
      },
      {
        $project: { _id: 1, takenBy: 1, score: 1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "takenBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: { userId: "$user._id", fullName: "$user.fullName" },
          score: { $sum: 1 },
        },
      },
      { $sort: { score: -1 } },
    ],
    (err, result) => {
      let activeGames = 0;
      result.forEach((obj) => {
        activeGames = activeGames + obj.score;
      });

      res.json({
        activeGames: activeGames,
      });
    }
  );
};

// exports.resetQuestionInfo = (req, res, next) => {
//   Question.find().then((questions) => {
//     questions.forEach((question) => {
//       question.answeredCorrectly = 0;
//       question.answeredIncorrectly = 0;
//       question.save();
//     });
//     res.json({ reset: "Reset successful" });
//   });
// };

// exports.changeQuestionsPoints = (req, res, next) => {
//   Question.find().then((questions) => {
//     let changes = 0;
//     questions.forEach((question) => {
//       if (question.points === 5) {
//         question.points = 10;
//         question.save();
//         changes = changes + 1;
//       } else if (question.points === 8) {
//         question.points = 15;
//         question.save();
//         changes = changes + 1;
//       } else if (question.points === 10) {
//         question.points = 20;
//         question.save();
//         changes = changes + 1;
//       }
//     });
//     res.json({
//       successfulChanges: changes,
//     });
//   });
// };
