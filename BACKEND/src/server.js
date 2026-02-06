require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const indexRoutes = require("./routes/index.routes");
const { connectDB } = require("./config/db"); 

const app = express();

app.use(cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello World" });
});

app.use("/api/v1", indexRoutes);

const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1); 
    }
};

startServer();