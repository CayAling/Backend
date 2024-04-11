const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');

// Authentication routes
router.post('/register', authController.register); // Sign up or register users
router.post('/login', authController.login); // Login users
router.post('/forgot-password', authController.forgotPassword); // Forgot password
router.put('/users/:id', authController.updateUserById); // Update user by ID
router.post('/submit', authController.submitFeedback);
router.get('/all', authController.getAllFeedbacks);
// Reset password GET 
router.get("/reset-password/:id/:token", authController.resetPasswordGet);
// Reset password POST
router.post("/reset-password/:id/:token",authController.resetPasswordPost);


module.exports = router;
