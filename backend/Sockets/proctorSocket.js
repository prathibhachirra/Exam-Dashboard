import jwt from "jsonwebtoken";
import Exam from "../Models/ExamModel.js";
import User from "../Models/UserModel.js";
import Violation from "../Models/ViolationModel.js";

const proctorSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user.role === "teacher") {
      socket.join(`teacher:${socket.user._id}`);
    }

    socket.on("join-exam", ({ examId }) => {
      if (examId) socket.join(`exam:${examId}`);
    });

    socket.on("proctor-event", async (data = {}) => {
      try {
        if (socket.user.role !== "student") return;

        const exam = await Exam.findById(data.examId);
        if (!exam) return;

        const violation = await Violation.create({
          studentId: socket.user._id,
          examId: exam._id,
          type: data.type || "suspicious-activity",
          message: data.message || "Suspicious activity detected",
          timestamp: new Date(),
        });

        const payload = {
          violation,
          student: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email,
          },
          exam: {
            id: exam._id,
            title: exam.title,
          },
        };

        io.to(`teacher:${exam.createdBy}`).emit("proctor-event", payload);
        io.to(`exam:${exam._id}`).emit("proctor-event", payload);
      } catch (error) {
        socket.emit("proctor-error", { message: error.message });
      }
    });
  });
};

export default proctorSocket;
