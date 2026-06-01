import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    duration: {
      type: Number,
      required: true,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    passingMarks: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
