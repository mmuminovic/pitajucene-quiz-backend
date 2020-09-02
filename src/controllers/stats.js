const mongoose = require('mongoose')
const Quiz = require('../models/quiz')

exports.statistics = async (req, res) => {
    const { month } = req.query

    try {
        let games = await Quiz.aggregate([
            {
                $project: { createdAt: 1 },
            },
        ])
        games = games.map((quiz) => quiz.createdAt)

        const data = {}

        if (!month) {
            const stats = {}
            games.forEach((date, i) => {
                let months = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                const years = Object.keys(stats)
                if (
                    years.indexOf(new Date(date).getFullYear().toString()) !==
                    -1
                ) {
                    months = stats[new Date(date).getFullYear().toString()]
                }
                months[new Date(date).getMonth()]++
                Object.assign(stats, {
                    [new Date(date).getFullYear().toString()]: months,
                })
            })
            data.stats = stats
            data.month = null
        } else {
            const gamesInMonth = games.filter(
                (game) => new Date(game).getMonth() === parseInt(month)
            )
            const statsMonth = {}
            gamesInMonth.forEach((date) => {
                let gamesInDays = []
                for (let i = 0; i < 28; i++) {
                    gamesInDays.push(0)
                }
                const years = Object.keys(statsMonth)
                if (
                    years.indexOf(new Date(date).getFullYear().toString()) !==
                    -1
                ) {
                    gamesInDays =
                        statsMonth[new Date(date).getFullYear().toString()]
                }
                if (gamesInDays[new Date(date).getDate() - 1] === undefined) {
                    gamesInDays.push(0)
                }
                gamesInDays[new Date(date).getDate() - 1]++
                Object.assign(statsMonth, {
                    [new Date(date).getFullYear().toString()]: gamesInDays,
                })
            })
            data.stats = null
            data.month = statsMonth
        }

        res.json(data)
    } catch (error) {
        res.status(500).json(error)
    }
}

// My scores
exports.getMyScores = async (req, res, next) => {
    const userId = mongoose.Types.ObjectId(req.user.id)
    const date = new Date()
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const { email, fullName } = req.user
    try {
        const result = await Quiz.aggregate([
            {
                $match: {
                    takenBy: userId,
                    score: { $gte: 0 },
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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        const ranking = result.map((obj, i) => {
            let minutes = Math.floor(obj.duration / 60000)
            let seconds = ((obj.duration % 60000) / 1000).toFixed(0)
            if (seconds.length === 1) {
                seconds = `0${seconds}`
            }
            const data = {
                score: obj.score,
                duration: `${minutes}:${seconds}`,
            }
            return data
        })

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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        const topRecords = bestScores.map((obj, i) => {
            let minutes = Math.floor(obj.duration / 60000)
            let seconds = ((obj.duration % 60000) / 1000).toFixed(0)
            if (seconds.length === 1) {
                seconds = `0${seconds}`
            }
            const data = {
                score: obj.score,
                duration: `${minutes}:${seconds}`,
            }
            return data
        })

        // Last period score
        const firstDayOfLastMonth = new Date(
            date.getFullYear(),
            date.getMonth() - 1,
            1
        )
        const firstDayOfThisMonth = new Date(
            date.getFullYear(),
            date.getMonth(),
            0
        )

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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        let rankingLastPeriod
        if (lastMonthScores.length !== 0) {
            rankingLastPeriod = lastMonthScores.map((obj, i) => {
                let minutes = Math.floor(obj.duration / 60000)
                let seconds = ((obj.duration % 60000) / 1000).toFixed(0)
                if (seconds.length === 1) {
                    seconds = `0${seconds}`
                }
                const data = {
                    score: obj.score,
                    duration: `${minutes}:${seconds}`,
                }
                return data
            })
        } else {
            rankingLastPeriod = [
                {
                    score: 0,
                    duration: `0:00`,
                },
            ]
        }

        res.status(200).json({
            user: {
                email,
                fullName,
            },
            score: ranking[0],
            theBestScore: topRecords[0],
            scoreLastMonth: rankingLastPeriod[0],
        })
    } catch (error) {
        res.status(500).json({ error })
    }
}

// RANKING LIST
exports.getRankingLists = async (req, res, next) => {
    const date = new Date()
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    let lastDay = new Date(date.getFullYear(), date.getMonth(), 15)
    if (Date.now() > lastDay) {
        firstDay = new Date(date.getFullYear(), date.getMonth(), 15)
        lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    }
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ]
    const [year1, year2] = [firstDay.getFullYear(), lastDay.getFullYear()]
    const [month1, month2] = [
        months[firstDay.getMonth()],
        months[lastDay.getMonth()],
    ]
    const [day1, day2] = [firstDay.getDate(), lastDay.getDate()]
    const time1 = day1 + ' ' + month1 + ' ' + year1
    const time2 = day2 + ' ' + month2 + ' ' + year2

    const rankingThisMonthTitle = `${time1} - ${time2}`

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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
            {
                $group: {
                    _id: { takenBy: '$takenBy' },
                    score: { $max: '$score' },
                    duration: { $first: '$duration' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.takenBy',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        let rankingList = []
        result.forEach((obj, i) => {
            if (!obj.user[0].isWinner) {
                let minutes = Math.floor(obj.duration / 60000)
                let seconds = ((obj.duration % 60000) / 1000).toFixed(0)
                if (seconds.length === 1) {
                    seconds = `0${seconds}`
                }
                const data = {
                    userId: obj.user[0]._id,
                    fullName: obj.user[0].fullName,
                    score: obj.score,
                    duration: `${minutes}:${seconds}`,
                }
                rankingList.push(data)
            }
        })

        const currentRankingList = {
            rankingList: rankingList.slice(0, 20),
            rankingListTitle: rankingThisMonthTitle,
        }

        // Ranking list of last month
        let rankingLastPeriod

        const date = new Date()
        let firstDayOfLastMonth = new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        )
        let lastDayOfLastMonth = new Date(
            date.getFullYear(),
            date.getMonth(),
            15
        )
        if (Date.now() < lastDayOfLastMonth.getTime()) {
            firstDayOfLastMonth = new Date(
                date.getFullYear(),
                date.getMonth() - 1,
                15
            )
            lastDayOfLastMonth = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            )
        }

        const [year1, year2] = [
            firstDayOfLastMonth.getFullYear(),
            lastDayOfLastMonth.getFullYear(),
        ]
        const [month1, month2] = [
            months[firstDayOfLastMonth.getMonth()],
            months[lastDayOfLastMonth.getMonth()],
        ]
        const [day1, day2] = [
            firstDayOfLastMonth.getDate(),
            lastDayOfLastMonth.getDate(),
        ]
        const time1 = day1 + ' ' + month1 + ' ' + year1
        const time2 = day2 + ' ' + month2 + ' ' + year2

        const rankingListTitle = `${time1} - ${time2}`

        const resultLastMonth = await Quiz.aggregate([
            {
                $match: {
                    score: { $gt: 0 },
                    updatedAt: {
                        $gt: firstDayOfLastMonth,
                        $lt: lastDayOfLastMonth,
                    },
                },
            },
            {
                $project: {
                    createdAt: 1,
                    updatedAt: 1,
                    score: 1,
                    takenBy: 1,
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
            {
                $group: {
                    _id: { takenBy: '$takenBy' },
                    score: { $max: '$score' },
                    duration: { $first: '$duration' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.takenBy',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        const numDaysBetween = (d1, d2) => {
            var diff = Math.abs(d1.getTime() - d2.getTime())
            return diff / (1000 * 60 * 60 * 24)
        }
        let rankingListLastPeriod = []
        resultLastMonth.forEach((obj, i) => {
            let minutes, seconds, data
            if (obj.user[0].isWinner) {
                if (
                    numDaysBetween(obj.user[0].updatedAt, lastDayOfLastMonth) <
                    5
                ) {
                    minutes = Math.floor(obj.duration / 60000)
                    seconds = ((obj.duration % 60000) / 1000).toFixed(0)
                    if (seconds.length === 1) {
                        seconds = `0${seconds}`
                    }
                    data = {
                        userId: obj.user[0]._id,
                        fullName: obj.user[0].fullName,
                        score: obj.score,
                        duration: `${minutes}:${seconds}`,
                    }
                }
            } else {
                minutes = Math.floor(obj.duration / 60000)
                seconds = ((obj.duration % 60000) / 1000).toFixed(0)
                if (seconds.length === 1) {
                    seconds = `0${seconds}`
                }
                data = {
                    userId: obj.user[0]._id,
                    fullName: obj.user[0].fullName,
                    score: obj.score,
                    duration: `${minutes}:${seconds}`,
                }
            }
            if (data) {
                rankingListLastPeriod.push(data)
            }
        })

        rankingLastPeriod = {
            rankingList: rankingListLastPeriod.slice(0, 10),
            rankingListTitle: rankingListTitle,
        }

        let top10ranking

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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
            {
                $group: {
                    _id: { takenBy: '$takenBy' },
                    score: { $max: '$score' },
                    duration: { $first: '$duration' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.takenBy',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        const ranking = resultTopTen.map((obj, i) => {
            let minutes = Math.floor(obj.duration / 60000)
            let seconds = (obj.duration % 60000) / 1000
            if (seconds.toFixed(0).length === 1) {
                seconds = `0${seconds}`
            }
            const data = {
                userId: obj.user[0]._id,
                fullName: obj.user[0].fullName,
                score: obj.score,
                duration: `${minutes}:${seconds}`,
            }
            return data
        })

        top10ranking = ranking.slice(0, 10)

        // Today
        let theBestToday

        const today = new Date()
        today.setHours(0)
        today.setMinutes(0)
        today.setSeconds(0)
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
                    duration: { $subtract: ['$updatedAt', '$createdAt'] },
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
            {
                $group: {
                    _id: { takenBy: '$takenBy' },
                    score: { $max: '$score' },
                    duration: { $first: '$duration' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.takenBy',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $sort: { score: -1, duration: 1 },
            },
        ])

        const rankingToday = resultToday.map((obj, i) => {
            let minutes = Math.floor(obj.duration / 60000)
            let seconds = ((obj.duration % 60000) / 1000).toFixed(0)
            if (seconds.length === 1) {
                seconds = `0${seconds}`
            }
            const data = {
                fullName:
                    obj.user.length > 0 ? obj.user[0].fullName : 'Nepoznat',
                score: obj.score,
                duration: `${minutes}:${seconds}`,
            }
            return data
        })

        return res.json(rankingToday)
        theBestToday = rankingToday[0]

        const time = new Date(Date.now() - 30 * 60 * 1000)
        const activeGamesResult = await Quiz.aggregate([
            {
                $match: { createdAt: { $gt: time }, active: true },
            },
            {
                $project: { _id: 1, takenBy: 1, score: 1 },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'takenBy',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $group: {
                    _id: { userId: '$user._id', fullName: '$user.fullName' },
                    score: { $sum: 1 },
                },
            },
            { $sort: { score: -1 } },
        ])
        let activeGames = 0

        activeGamesResult.forEach((obj) => {
            activeGames = activeGames + obj.score
        })

        res.status(200).json({
            playedToday: rankingToday.length,
            activeGames,
            theBestToday,
            currentRankingList,
            rankingLastPeriod,
            top10ranking,
        })
    } catch (error) {
        res.status(500).json({ error })
    }
}
