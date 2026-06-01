import Exam from "../Models/ExamModel.js";
import Violation from "../Models/ViolationModel.js";

async function createViolation(req, res, type, defaultMessage) {
  try {
    const { examId, message } = req.body;

    if (!examId) {
      return res.status(400).json({ message: "Exam is required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const violation = await Violation.create({
      studentId: req.user._id,
      examId,
      type,
      message: message || defaultMessage,
      timestamp: new Date(),
    });

    const io = req.app.get("io");
    if (io) {
      const payload = {
        violation,
        student: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        exam: {
          id: exam._id,
          title: exam.title,
        },
      };

      // Emit to teacher's specific room
      io.to(`teacher:${exam.createdBy.toString()}`).emit("proctor-event", payload);
      // Also emit to exam room for students monitoring
      io.to(`exam:${exam._id.toString()}`).emit("proctor-event", payload);
    }

    res.status(201).json({
      message: "Proctoring event recorded",
      violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const detectTabSwitch = (req, res) => createViolation(req, res, "tab-switch", "Student switched tabs");

export const detectFocusLoss = (req, res) => createViolation(req, res, "focus-loss", "Exam window lost focus");

export const detectWebcamViolation = (req, res) =>
  createViolation(req, res, "webcam-violation", "Webcam violation detected");

export const detectSuspiciousActivity = (req, res) =>
  createViolation(req, res, "suspicious-activity", "Suspicious activity detected");

export const getTeacherProctorLogs = async (req, res) => {
  try {
    const teacherExams = await Exam.find({ createdBy: req.user._id }).select("_id");
    const examIds = teacherExams.map((exam) => exam._id);
    const logs = await Violation.find({ examId: { $in: examIds } })
      .populate("studentId", "name email")
      .populate("examId", "title")
      .sort({ timestamp: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
