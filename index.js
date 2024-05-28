// index.js
const express = require("express");
const app = express();
const cors = require("cors");
const auth = require("./routes/auth");

// middleware
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'jwt_token', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
  }));

app.use(express.json());

// Use routes
app.use('/auth', auth);

app.listen(5000, () => {
    console.log("server has started on port 5000");
});
