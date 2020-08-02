const express = require('express');

const router = express.Router();

const quotesController = require('../controllers/quote');
const isAuth = require('../middlewares/isAuth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/get-quote/:quoteId', isAuth, quotesController.getQuote);
router.get('/get-all-quotes', isAuth, quotesController.getAllQuotes);
router.get('/get-random-quote', isAuth, quotesController.getRandomQuote);
router.post('/add-quote', isAdmin, quotesController.addQuote);
router.patch('/like/:quoteId', isAuth, quotesController.likeQuote);
router.patch('/edit/:quoteId', isAdmin, quotesController.editQuote);
router.delete('/delete/:quoteId', isAdmin, quotesController.deleteQuote);

module.exports = router;