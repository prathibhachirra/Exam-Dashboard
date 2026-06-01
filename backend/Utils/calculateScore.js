const calculateScore = (studentAnswers, questions) => {
  let score = 0;

  questions.forEach((question) => {
    const answer = studentAnswers.find(
      (ans) =>
        ans.questionId.toString() === question._id.toString()
    );

    if (
      answer &&
      answer.selectedAnswer === question.correctAnswer
    ) {
      score += question.marks;
    }
  });

  return score;
};

export default calculateScore;