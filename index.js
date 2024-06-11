require('dotenv').config();
const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const event = require("./routes/event");
const loadModel = require('./middleware/loadModel');
const profile = require("./routes/profile");

const startServer = async () => {
    const app = express();

    // middleware
    app.use(cors({
        origin: ['*'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'jwt_token', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));

    app.use(express.json());

    // Load the model
    const model = await loadModel();
    app.modelNSFW = model;
    console.log("Model loaded and server is starting...");

    // Use routes
    app.use('/auth', auth);
    app.use('/event', event);
    app.use('/profile', profile);

    // Start the server
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server has started on port ${process.env.PORT || 5000}`);
    });
};

// Start the server
startServer();
