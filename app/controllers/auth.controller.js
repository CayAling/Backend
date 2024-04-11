// Import necessary modules and models
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const nodemailer = require('nodemailer');
const Role = require('../models/Role');
const Feedback = require ('../models/feedback');
const multer = require('multer');
const path = require('path');
const Collector = require('../models/collectors');

// Initialize counts object to maintain counts per location
let counts = {}; 

// List of barangays in Bongao, Tawi-Tawi, Philippines
const location= [
    "Bongao Poblacion",
    "Ipil",
    "Kamagong",
    "Karungdong",
    "Lagasan",
    "Lakit Lakit",
    "Lamion",
    "Lapid Lapid",
    "Lato Lato",
    "Luuk Pandan",
    "Luuk Tulay",
    "Malassa",
    "Mandulan",
    "Masantong",
    "Montay Montay",
    "Nalil",
    "Pababag",
    "Pag-asa",
    "Pagasinan",
    "Pagatpat",
    "Pahut",
    "Pakias",
    "Paniongan",
    "Pasiagan",
    "Sanga-sanga",
    "Silubog",
    "Simandagit",
    "Sumangat",
    "Tarawakan",
    "Tongsinah",
    "Tubig Basag",
    "Tubig Tanah",
    "Tubig-Boh",
    "Tubig-Mampallam",
    "Ungus-ungus"
];
 // Function to check if location is in the list of barangays
function isValidLocation(location) {
    return location.includes(location);
}

// Configure Multer to store uploaded images locally
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads')); // Set the destination directory for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set a unique filename for uploaded images
    }
});
const upload = multer({ storage: storage });

// User Register
exports.register = async (req, res) => {
    try {
        // Extract necessary fields from request body including location
        const { username, email, password, roleId, contact,  profilePicture, idPicture, license, biodata, birthCertificate, vehicleType, quantityGarbageSack, location } = req.body;

        // Check if any required field is missing
        if (!username || !email || !password || !roleId || !contact || !location) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the username is already registered
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already registered' });
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

         // Check if the location is in the list of barangays
         if (!isValidLocation(location)) {
            return res.status(400).json({ error: 'The provided location is not in the list. Please choose from: ' + barangays.join(', ') });
        }

        // Find the role corresponding to the provided role ID
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(400).json({ message: 'Role not found' });
        }
        // If the selected role is 'collector'
                if (role.name === 'collector') {
                    // Check if vehicle type and quantityGarbageSack are provided
                    if (!vehicleType || !quantityGarbageSack) {
                        return res.status(400).json({ error: 'Vehicle type and quantityGarbageSack are required for collector registration' });
                    }

                    const acceptedVehicleTypes = Collector.schema.path('vehicleType').enumValues;

                    // Validate the provided vehicleType
                    if (!acceptedVehicleTypes.includes(vehicleType)) {
                        return res.status(400).json({ error: 'Invalid vehicle type. Please choose from: ' + acceptedVehicleTypes.join(', ') });
                    }
                }

                        // Use geocodeLocation function to find the nearest location
                

                // Initialize counts for the nearestCollectorLocation if not already initialized
if (!counts[location]) {
    counts[location] = {
        numResidents: 0,
        numCollectors: 0
    };
}

// Logic to check if the registration is allowed based on resident and collector counts for the location
if (role.name === 'resident') {
    const numResidents = counts[location]?.numResidents || 0;
    const numCollectors = counts[location]?.numCollectors || 0;

    // Check if the number of residents exceeds the limit
    if (numResidents >= numCollectors * 3) {
        return res.status(400).json({ error: 'The number of residents already exceeds the allowed margin for the collectors in this location' });
    }

    // Increment the number of residents
    counts[location] = { ...counts[location], numResidents: numResidents + 1 };
} else if (role.name === 'collector') {
    const numCollectors = counts[location]?.numCollectors || 0;
    const numResidents = counts[location]?.numResidents || 0;

    // Check if there are already collectors in the location
    if (numCollectors < 2 && numResidents <= 6) {
        // Allow registration if less than 2 collectors and 6 residents
        counts[location] = { ...counts[location], numCollectors: numCollectors + 1 };
    } else {
        // Hold the registration of the new collector
        return res.status(400).json({ error: 'Collector registration is temporarily on hold. Please wait until the conditions are met.' });
    }
}

// Check if the number of residents exceeds 6 and the number of collectors exceeds 2
// If so, reset the counts to allow further registrations
if (counts[location].numResidents >= 6 && counts[location].numCollectors >= 2) {
    counts[location] = {
        numResidents: 0,
        numCollectors: 0
    };
}

        console.log('Counts after registration:', counts); // Log counts after registration
        // Create a new user object
        const newUser = new User({ username, email, password, roles: [roleId], contact, location });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        newUser.password = hashedPassword;

         // Handle profile picture upload for all users
         upload.single('profilePicture')(req, res, async (err) => {
            if (err) {
                console.error('Error while uploading profile picture:', err);
                return res.status(500).json({ error: 'Error uploading profile picture' });
            }

            // Save the filename of the uploaded profile picture to the user object
            if (req.file) {
                newUser.profilePicture = req.file.filename;
            }

            try {
                // Save the user
                await newUser.save();

                // If the selected role is 'collector'
        if (role.name === 'collector') {
            
            // Handle ID picture upload
            upload.single('idPicture')(req, res, async (err) => {
                if (err) {
                    console.error('Error while uploading ID picture:', err);
                    return res.status(500).json({ error: 'Error uploading ID picture' });
                }

                // Save the filename of the uploaded ID picture to the newUser object
                if (req.file) {
                    newUser.idPicture = req.file.filename;
                }

                // Handle license upload
                upload.single('license')(req, res, async (err) => {
                    if (err) {
                        console.error('Error while uploading license:', err);
                        return res.status(500).json({ error: 'Error uploading license' });
                    }
                    if (req.file) {
                        newUser.license = req.file.filename;
                    }

                    // Handle biodata upload
                    upload.single('biodata')(req, res, async (err) => {
                        if (err) {
                            console.error('Error while uploading biodata:', err);
                            return res.status(500).json({ error: 'Error uploading biodata' });
                        }
                        if (req.file) {
                            newUser.biodata = req.file.filename;
                        }

                        // Handle birth certificate upload
                        upload.single('birthCertificate')(req, res, async (err) => {
                            if (err) {
                                console.error('Error while uploading birth certificate:', err);
                                return res.status(500).json({ error: 'Error uploading birth certificate' });
                            }
                            if (req.file) {
                                newUser.birthCertificate = req.file.filename;
                            }

                            try {
                                // Create a new collector object
                                const newCollector = new Collector({ userId: newUser._id, vehicleType, quantityGarbageSack });

                                // Save the collector
                                await newCollector.save();

                                // Save the user
                                await newUser.save();

                                res.status(201).json({ message: 'User registration submitted for verification' });
                            } catch (error) {
                                // Handle other errors
                                console.error('Error while saving user:', error);
                                res.status(500).json({ error: 'Internal Server Error', details: error.message });
                            }
                        });
                    });
                });
            });
        } else {
            // If the selected role is not 'collector'
            // Create a new user object
            const newUser = new User({ username, email, password, roles: [roleId], contact, location });

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            newUser.password = hashedPassword;

            // Save the user
            await newUser.save();
        }

                res.status(201).json({ message: 'User registration submitted for verification' });
            } catch (error) {
                // Handle other errors
                console.error('Error while saving user:', error);
                res.status(500).json({ error: 'Internal Server Error', details: error.message });
            }
        });
    } catch (err) {
        console.error('Error while handling user registration:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, roles: user.roles }, config.secret, { expiresIn: '1h' });

        // Return user data and token
        res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.roles,
            accessToken: token
        });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Forgot password controller
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate JWT token with user's email and a secret key
        const token = jwt.sign({ email: user.email }, config.secret, { expiresIn: '1h' });
        
        // Construct the password reset link
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        // Send password reset link via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cay48945@gmail.com',
                pass: 'unly yyyc fpzq rezs'
            }
        });
        
        const mailOptions = {
            from: 'cay48945@gmail.com',
            to: user.email,
            subject: 'Password Reset Request',
            text: `You are receiving this email because you has requested to reset the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error while sending email:', error);
                return res.status(500).json({ error: 'Internal Server Error', details: error.message });
            }
            
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Password reset link has been sent to your email' });
        });
    } catch (err) {
        console.error('Error while handling forgot password request:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
// Reset password GET 
exports.resetPasswordGet = async (req, res) => {
    try {
        const { id, token } = req.params;
        const oldUser = await User.findOne({ _id: id });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = JWT_SECRET + oldUser.password;
        try {
            const verify = jwt.verify(token, secret);
            res.render("index", { email: verify.email, status: "Not Verified" });
        } catch (error) {
            console.log(error);
            res.send("Not Verified");
        }
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
};

// Reset password POST 
exports.resetPasswordPost = async (req, res) => {
    try {
        const { id, token } = req.params;
        const { password } = req.body;

        const oldUser = await User.findOne({ _id: id });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = JWT_SECRET + oldUser.password;
        try {
            const verify = jwt.verify(token, secret);
            const encryptedPassword = await bcrypt.hash(password, 10);
            await User.updateOne(
                {
                    _id: id,
                },
                {
                    $set: {
                        password: encryptedPassword,
                    },
                }
            );

            res.render("index", { email: verify.email, status: "verified" });
        } catch (error) {
            console.log(error);
            res.json({ status: "Something Went Wrong" });
        }
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
};

// Update user by ID
exports.updateUserById = async (req, res) => {
    try {
        const { username, email, password, contact, location} = req.body;

        console.log("Request Body:", req.body); // Log request body to check if vehicleType and quantityGarbageSack are included

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("User before update:", user); // Log user document before update

        // Update user data
        user.username = username;
        user.email = email;
        user.contact = contact;
        user.location=location;

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        const updatedUser = await user.save(); // Save the updated user document

        console.log("User after update:", updatedUser); // Log user document after update

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.submitFeedback = async (req, res) => {
    try {
        const { userId, feedback } = req.body;
        // Create a new feedback object
        const newFeedback = new Feedback({
            userId,
            feedback
        });
        
        // Populate the userId field
        await newFeedback.populate({
            path: 'userId',
            select: 'username contact location'
        });
        
        // Now save the feedback
        await newFeedback.save();
        
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error while submitting feedback:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
exports.getAllFeedbacks = async (req, res) => {
    try {
        const allFeedbacks = await Feedback.find();

        res.status(200).json({ feedbacks: allFeedbacks });
    } catch (error) {
        console.error('Error while fetching feedbacks:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};