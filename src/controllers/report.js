const mongoose = require('mongoose')
const Report = require('../models/report')
const { validationResult } = require('express-validator')

exports.getReports = async (req, res, next) => {
    const { condition } = req.query
    try {
        const reports = await Report.find(condition)
            .sort({ createdAt: -1 })
            .populate('reportedBy')

        const mappedReports = reports.map((obj) => {
            const a = new Date(obj.createdAt)
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
            const year = a.getFullYear()
            const month = months[a.getMonth()]
            const date = a.getDate()
            let hour = a.getHours()
            if (hour.toString().length == 1) {
                hour = '0' + hour
            }
            let min = a.getMinutes()
            if (min.toString().length == 1) {
                min = '0' + min
            }
            let sec = a.getSeconds()
            if (sec.toString().length == 1) {
                sec = '0' + sec
            }
            const time =
                date +
                ' ' +
                month +
                ' ' +
                year +
                ' ' +
                hour +
                ':' +
                min +
                ':' +
                sec

            let selectedReport = {
                _id: obj._id,
                message: obj.message,
                userId: obj.reportedBy ? obj.reportedBy._id : 'Greška',
                fullName: obj.reportedBy ? obj.reportedBy.fullName : 'Greška',
                questionId: obj.questionId,
                questionText: obj.reportedQuestion,
                answer: obj.answer,
                time: time,
                solved: obj.solved,
            }

            return selectedReport
        })

        res.status(200).json(mappedReports)
    } catch (error) {
        res.status(500).json(error)
    }
}

// exports.sendReport = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const error = new Error("Validation failed.");
//     error.statusCode = 500;
//     error.data = errors.array();
//     return res.json({ error: error.data[0].msg });
//   }
//   const {
//     reportedBy,
//     reportedQuestion,
//     questionId,
//     message,
//     answer,
//   } = req.body;
//   const newReport = new Report({
//     _id: new mongoose.Types.ObjectId(),
//     reportedBy: mongoose.Types.ObjectId(reportedBy),
//     reportedQuestion,
//     questionId,
//     message,
//     answer,
//   });

//   const result = await newReport.save();
//   res.json(result);
// };

// exports.editReport = (req, res, next) => {
//   const reportId = req.params.reportId;
//   Report.findOne({ _id: reportId }).then((report) => {
//     report.solved = true;
//     report.save().then((result) => {
//       res.json(result);
//     });
//   });
// };
