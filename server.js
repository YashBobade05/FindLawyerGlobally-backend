import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";



dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
    //   "http://localhost:5173/FindLawyerGlobally/", // local frontend
      "https://yashbobade05.github.io/FindLawyerGlobally/", // GitHub Pages frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

//survey routes
app.use("/api/survey", surveyRoutes);

// Test route
app.get("/", (req, res) => res.send("API is running..."));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
