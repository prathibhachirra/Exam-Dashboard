import express from "express";
import {
  detectFocusLoss,
  detectSuspiciousActivity,
  detectTabSwitch,
  detectWebcamViolation,
  getTeacherProctorLogs,
} from "../Controllers/proctorController.js";
import authMiddleware, { authorizeRoles } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/tab-switch", authMiddleware, authorizeRoles("student"), detectTabSwitch);
router.post("/focus-loss", authMiddleware, authorizeRoles("student"), detectFocusLoss);
router.post("/webcam-violation", authMiddleware, authorizeRoles("student"), detectWebcamViolation);
router.post("/suspicious-activity", authMiddleware, authorizeRoles("student"), detectSuspiciousActivity);
router.get("/logs", authMiddleware, authorizeRoles("teacher"), getTeacherProctorLogs);

export default router;
