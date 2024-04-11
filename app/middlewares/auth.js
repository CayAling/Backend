const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const User = require('../models/User'); // Import the User model to fetch user details

// Middleware to verify and decode JWT token
exports.verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decodedToken = jwt.verify(token.split(' ')[1], config.secret);
        console.log('Decoded User ID:', decodedToken.userId); // Log decoded user ID
        req.userId = decodedToken.userId;
        req.userRole = decodedToken.role; // Extract role information from decoded token

        // Fetch user details including location and attach it to req.user
        const user = await User.findById(decodedToken.userId);
        req.user = user; // Attach user details to req.user

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};



// Example usage of decoded role in other middleware
exports.isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Require Admin Role' });
    }
    next();
};

exports.isCollector = (req, res, next) => {
    if (req.userRole !== 'collector') {
        return res.status(403).json({ message: 'Require Collector Role' });
    }
    next();
};

exports.isResident = (req, res, next) => {
    if (req.userRole !== 'resident') {
        return res.status(403).json({ message: 'Require Resident Role' });
    }
    next();
};
