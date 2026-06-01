import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import proctorSocket from "./Sockets/proctorSocket.js";

import authRoutes from "./Routes/authRoutes.js"
import examRoutes from "./Routes/examRoutes.js"
import proctorRoutes from "./Routes/proctorRoutes.js"
import submissionRoutes from "./Routes/submissionRoutes.js"


dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
app.set("io", io);
proctorSocket(io);

// database connection
const mongoUrl = process.env.DB_URL || process.env.MONGO_URL;

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET not set. Set it in .env for production.");
}

if (mongoUrl) {
  mongoose
    .connect(mongoUrl)
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  console.warn("DB_URL or MONGO_URL not set. API endpoints require MongoDB to persist data.");
}

// routes
app.use("/auth-api",authRoutes);
app.use("/exam-api",examRoutes);
app.use("/proctor-api",proctorRoutes);
app.use("/submission-api",submissionRoutes);


// default route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Exam Proctoring Backend Running",
    database: mongoose.connection.readyState === 1 ? "connected" : "not-connected",
    clientOrigins: allowedOrigins,
  });
});

// server
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
