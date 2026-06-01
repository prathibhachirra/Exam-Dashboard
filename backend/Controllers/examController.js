import Exam from "../Models/ExamModel.js";
import Question from "../Models/QuestionModel.js";
import Submission from "../Models/SubmissionModel.js";

function sanitizeQuestion(question) {
  const item = question.toObject ? question.toObject() : question;
  delete item.correctAnswer;
  return item;
}

export const createExam = async (req, res) => {
  try {
    const { title, description, duration, passingMarks = 0, isActive = true, questions = [] } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "Title and duration are required" });
    }

    const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks || 1), 0);

    if (passingMarks > totalMarks) {
      return res.status(400).json({ message: `Passing marks (${passingMarks}) cannot be greater than total marks (${totalMarks})` });
    }

    const exam = await Exam.create({
      title,
      description,
      duration,
      passingMarks,
      isActive,
      totalMarks,
      createdBy: req.user._id,
    });

    if (questions.length) {
      await Question.insertMany(
        questions.map((question) => ({
          examId: exam._id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          marks: question.marks || 1,
        }))
      );
    }

    const savedQuestions = await Question.find({ examId: exam._id });

    res.status(201).json({
      message: "Exam created successfully",
      exam,
      questions: savedQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    const examIds = exams.map((exam) => exam._id);
    const questionCounts = await Question.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: "$examId", count: { $sum: 1 } } },
    ]);
    const submissionCounts = await Submission.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: "$examId", count: { $sum: 1 } } },
    ]);

    const countByExam = new Map(questionCounts.map((item) => [item._id.toString(), item.count]));
    const attemptsByExam = new Map(submissionCounts.map((item) => [item._id.toString(), item.count]));

    res.status(200).json({
      exams: exams.map((exam) => ({
        ...exam.toObject(),
        questionCount: countByExam.get(exam._id.toString()) || 0,
        attemptCount: attemptsByExam.get(exam._id.toString()) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveExams = async (req, res) => {
  try {
    const attempted = await Submission.find({ studentId: req.user._id }).select("examId");
    const attemptedIds = new Set(attempted.map((item) => item.examId.toString()));
    const exams = await Exam.find({ isActive: true }).populate("createdBy", "name").sort({ createdAt: -1 });

    res.status(200).json({
      exams: exams.map((exam) => ({
        ...exam.toObject(),
        attempted: attemptedIds.has(exam._id.toString()),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExamDetails = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("createdBy", "name email");

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (!exam.createdBy) {
      return res.status(500).json({ message: "Exam creator not found. Data integrity issue." });
    }

    if (req.user.role === "teacher" && exam.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own exams" });
    }

    if (req.user.role === "student" && !exam.isActive) {
      return res.status(403).json({ message: "This exam is not active" });
    }

    const questions = await Question.find({ examId: exam._id }).sort({ createdAt: 1 });

    res.status(200).json({
      exam,
      questions: req.user.role === "student" ? questions.map(sanitizeQuestion) : questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own exams" });
    }

    // Validate passing marks if being updated
    if (req.body.passingMarks !== undefined && req.body.passingMarks > exam.totalMarks) {
      return res.status(400).json({ message: `Passing marks (${req.body.passingMarks}) cannot be greater than total marks (${exam.totalMarks})` });
    }

    const allowed = ["title", "description", "duration", "passingMarks", "isActive"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) exam[field] = req.body[field];
    });
    await exam.save();

    res.status(200).json({ message: "Exam updated successfully", exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own exams" });
    }

    await Promise.all([
      Question.deleteMany({ examId: exam._id }),
      Submission.deleteMany({ examId: exam._id }),
      Exam.deleteOne({ _id: exam._id }),
    ]);

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only manage your own exams" });
    }

    const question = await Question.create({ ...req.body, examId: exam._id });
    exam.totalMarks += Number(question.marks || 1);
    await exam.save();

    res.status(201).json({ message: "Question added successfully", question, exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const exam = await Exam.findById(question.examId);
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only manage your own exams" });
    }

    const previousMarks = Number(question.marks || 0);
    ["question", "options", "correctAnswer", "marks"].forEach((field) => {
      if (req.body[field] !== undefined) question[field] = req.body[field];
    });
    await question.save();

    exam.totalMarks += Number(question.marks || 0) - previousMarks;
    await exam.save();

    res.status(200).json({ message: "Question updated successfully", question, exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const exam = await Exam.findById(question.examId);
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only manage your own exams" });
    }

    exam.totalMarks = Math.max(0, Number(exam.totalMarks || 0) - Number(question.marks || 0));
    await Promise.all([exam.save(), Question.deleteOne({ _id: question._id })]);

    res.status(200).json({ message: "Question deleted successfully", exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
