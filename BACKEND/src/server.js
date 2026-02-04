require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const indexRoutes = require("./routes/index.routes");
const { connectDB, disconnectDB } = require("./config/db");
const env = require("./config/env");
const app = express();

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1", indexRoutes);

connectDB();

app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello World" });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));