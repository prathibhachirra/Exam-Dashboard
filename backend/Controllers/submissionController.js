import Exam from "../Models/ExamModel.js";
import Question from "../Models/QuestionModel.js";
import Submission from "../Models/SubmissionModel.js";
import calculateScore from "../Utils/calculateScore.js";

export const submitExam = async (req, res) => {
  try {
    const { examId, answers = [] } = req.body;

    if (!examId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Exam and answers are required" });
    }

    const exam = await Exam.findById(examId);

    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: "Active exam not found" });
    }

    const existingSubmission = await Submission.findOne({ examId, studentId: req.user._id });
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this exam" });
    }

    const questions = await Question.find({ examId });
    const normalizedAnswers = answers.map((answer) => ({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
    }));
    const score = calculateScore(normalizedAnswers, questions);
    const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
    const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    const status = score >= Number(exam.passingMarks || 0) ? "pass" : "fail";

    const submission = await Submission.create({
      studentId: req.user._id,
      examId,
      answers: normalizedAnswers,
      score,
      totalMarks,
      percentage,
      status,
      submittedAt: new Date(),
    });

    res.status(201).json({
      message: "Exam submitted successfully",
      result: submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted this exam" });
    }

    res.status(500).json({ message: error.message });
  }
};

export const getMyResults = async (req, res) => {
  try {
    const results = await Submission.find({ studentId: req.user._id })
      .populate("examId", "title duration totalMarks passingMarks")
      .sort({ submittedAt: -1 });

    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherResults = async (req, res) => {
  try {
    const teacherExams = await Exam.find({ createdBy: req.user._id }).select("_id");
    const examIds = teacherExams.map((exam) => exam._id);
    const results = await Submission.find({ examId: { $in: examIds } })
      .populate("studentId", "name email")
      .populate("examId", "title totalMarks passingMarks")
      .sort({ submittedAt: -1 });

    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExamAttempts = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view attempts for your own exams" });
    }

    const attempts = await Submission.find({ examId: exam._id })
      .populate("studentId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({ attempts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResult = async (req, res) => {
  try {
    const result = await Submission.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("examId", "title createdBy totalMarks passingMarks");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const isOwner = result.studentId._id.toString() === req.user._id.toString();
    const isTeacher = result.examId.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ message: "You are not authorized to view this result" });
    }

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
