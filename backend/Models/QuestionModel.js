import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => options.length >= 2,
        message: "At least two options are required",
      },
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    marks: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
