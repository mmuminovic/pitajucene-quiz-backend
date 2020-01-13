const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const userController = require('./userController');
const isAuth = require('../middlewares/isAuth');
const isAdmin = require('../middlewares/isAdmin');

const User = require('./userModel');

// Login
router.post('/login',
    [body('email')
        .isEmail()
        .withMessage('Unesite ispravnu e-mail adresu.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Šifra mora imati više od 6 a manje od 20 karaktera')
        .isAlphanumeric()
        .trim()],
    userController.login);

// Signup
router.post('/signup', [
    body('email')
        .isEmail()
        .withMessage('Unesite ispravnu e-mail adresu.')
        .isLength({ min: 6, max: 100 })
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject('E-Mail već postoji. Izaberi neki drugi.');
                }
            });
        })
        .normalizeEmail(),
    body(
        'password',
        'Unesi šifru sa najmanje 6 a najviše 20 karaktera koristeći samo slova i brojeve.'
    ).trim()
        .isLength({ min: 6, max: 20 })
        .isAlphanumeric(),
    body(
        'fullName',
        'Unesi ispravno puno ime i prezime.'
    ).isLength({ min: 3, max: 40 }),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Unete šifre moraju biti iste.');
            }
            return true;
        })
        .trim()
], userController.signup);

// Get all users
router.get('/users', isAdmin, userController.allUsers);

// Get user's info
router.get('/users/:userId', userController.getUserInfo);

// Edit user
router.patch('/user/:userId',
    body(
        'password',
        'Unesi šifru sa najmanje 6 a najviše 20 karaktera koristeći samo slova i brojeve.'
    ).trim()
        .isLength({ min: 6, max: 20 })
        .isAlphanumeric(),
    isAdmin, userController.editUser);

// Detele user
router.delete('/user/:userId', isAdmin, userController.deleteUser);


module.exports = router;