import express from "express";
import {
  getExamAttempts,
  getMyResults,
  getResult,
  getTeacherResults,
  submitExam,
} from "../Controllers/submissionController.js";
import authMiddleware, { authorizeRoles } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit", authMiddleware, authorizeRoles("student"), submitExam);
router.get("/my-results", authMiddleware, authorizeRoles("student"), getMyResults);
router.get("/teacher-results", authMiddleware, authorizeRoles("teacher"), getTeacherResults);
router.get("/exam/:examId/attempts", authMiddleware, authorizeRoles("teacher"), getExamAttempts);
router.get("/result/:id", authMiddleware, getResult);

export default router;
