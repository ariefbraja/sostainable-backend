// index.js
require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const auth = require("./routes/auth");
const event = require("./routes/event");
const profile = require("./routes/profile");

// middleware
app.use(cors({
    origin: ['*'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'jwt_token', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
  }));

app.use(express.json());

// Use routes
app.use('/auth', auth);
app.use('/event', event);
app.use('/profile', profile);

app.listen(process.env.PORT || 5000, () => {
    console.log("server has started on port 5000");
});
