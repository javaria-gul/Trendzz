import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // NEW IMPORT


dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
// server.js mein body parser ke section mein
app.use(express.json({ limit: '50mb' })); // Default: 100kb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Agar multer use kar rahe ho toh:
// app.use(multer({ limits: { fileSize: 50 * 1024 * 1024 } }).any());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes); // NEW ROUTE
app.listen(process.env.PORT, () => {
  console.log(` Server running on port ${process.env.PORT}`);
});