import mongoose from "mongoose";

const violationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "tab-switch",
        "focus-loss",
        "suspicious-activity",
        "multiple-person-detected",
        "mobile-detected",
        "webcam-off",
        "webcam-violation",
      ],
      required: true,
    },

    message: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Violation = mongoose.model("Violation", violationSchema);

export default Violation;
