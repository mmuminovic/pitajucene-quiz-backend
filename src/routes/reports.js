const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const isAuth = require('../middlewares/isAuth')
const isAdmin = require('../middlewares/isAdmin')
const reportsController = require('../controllers/report')

router.get('/get-reports', isAdmin, reportsController.getReports)
// router.post(
//   "/send-report",
//   [
//     body(
//       "message",
//       "Tekst mora da ima najmanje 10 a najviše 200 karaktera."
//     ).isLength({ min: 10, max: 200 }),
//   ],
//   isAuth,
//   reportsController.sendReport
// );
// router.patch("/edit-report/:reportId", isAdmin, reportsController.editReport);

module.exports = router
