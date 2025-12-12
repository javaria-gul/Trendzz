import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chat.js"; // ADD THIS
import setupSocket from "./socket/socket.js"; // ADD THIS

dotenv.config();
connectDB();

const app = express();
const server = createServer(app); // CREATE HTTP SERVER

// Setup Socket.io
const io = setupSocket(server);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api", chatRoutes); // ADD THIS - Chat routes

// Start server with socket.io
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

export { io }; // Export io for use in other files if needed