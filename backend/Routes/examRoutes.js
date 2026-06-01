import express from "express";
import {
  addQuestion,
  createExam,
  deleteExam,
  deleteQuestion,
  getActiveExams,
  getExamDetails,
  getTeacherExams,
  updateExam,
  updateQuestion,
} from "../Controllers/examController.js";
import authMiddleware, { authorizeRoles } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("teacher"), createExam);
router.post("/create-exam", authMiddleware, authorizeRoles("teacher"), createExam);
router.get("/teacher", authMiddleware, authorizeRoles("teacher"), getTeacherExams);
router.get("/student/active", authMiddleware, authorizeRoles("student"), getActiveExams);
router.get("/all-exams", authMiddleware, getTeacherExams);
router.get("/:id", authMiddleware, getExamDetails);
router.put("/:id", authMiddleware, authorizeRoles("teacher"), updateExam);
router.delete("/:id", authMiddleware, authorizeRoles("teacher"), deleteExam);
router.post("/:examId/questions", authMiddleware, authorizeRoles("teacher"), addQuestion);
router.put("/questions/:questionId", authMiddleware, authorizeRoles("teacher"), updateQuestion);
router.delete("/questions/:questionId", authMiddleware, authorizeRoles("teacher"), deleteQuestion);

export default router;
