import express from "express";
import { getMe, loginUser, registerUser } from "../Controllers/authController.js";
import authMiddleware from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);

export default router;
