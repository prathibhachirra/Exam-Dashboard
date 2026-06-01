function StudentExam({
  activeQuestion,
  activityLog,
  answeredCount,
  cameraReady,
  progress,
  questions,
  registerViolation,
  selectedAnswers,
  setActiveQuestion,
  setSelectedAnswers,
  setSubmitted,
  submitted,
  tabStatus,
  videoRef,
  violations,
}) {
  const question = questions[activeQuestion]

  function selectAnswer(option) {
    setSelectedAnswers((answers) => ({
      ...answers,
      [activeQuestion]: option,
    }))
  }

  return (
    <div className="student-grid">
      <section className="exam-panel">
        <div className="exam-meta">
          <span>
            Question {activeQuestion + 1} of {questions.length}
          </span>
          <span>
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="progress-track" aria-label={`${progress}% complete`}>
          <div style={{ width: `${progress}%` }} />
        </div>

        <h2>{question.title}</h2>
        <div className="answer-list">
          {question.options.map((option) => (
            <button
              key={option}
              className={selectedAnswers[activeQuestion] === option ? 'selected' : ''}
              disabled={submitted}
              onClick={() => selectAnswer(option)}
            >
              <span>{option.charAt(0)}</span>
              {option}
            </button>
          ))}
        </div>

        <footer className="exam-controls">
          <button disabled={activeQuestion === 0} onClick={() => setActiveQuestion((index) => index - 1)}>
            Previous
          </button>
          <button
            disabled={activeQuestion === questions.length - 1}
            onClick={() => setActiveQuestion((index) => index + 1)}
          >
            Next
          </button>
          <button className="primary-button" disabled={submitted} onClick={() => setSubmitted(true)}>
            Submit test
          </button>
        </footer>
      </section>

      <aside className="monitor-panel">
        <div className="webcam-box">
          <video ref={videoRef} autoPlay muted playsInline className={cameraReady ? 'visible' : ''} />
          {!cameraReady && <div className="camera-fallback">Camera preview</div>}
          <span className={cameraReady ? 'camera-badge online' : 'camera-badge'}>{cameraReady ? 'Live' : 'Blocked'}</span>
        </div>

        <div className="metric-row">
          <div>
            <span className="label">Violations</span>
            <strong>{violations}/3</strong>
          </div>
          <div>
            <span className="label">Tab status</span>
            <strong>{tabStatus === 'visible' ? 'Focused' : 'Hidden'}</strong>
          </div>
        </div>

        <button className="danger-button" disabled={submitted} onClick={() => registerViolation('Face mismatch suspected')}>
          Add face alert
        </button>

        <div className="activity-list">
          <span className="label">Audit trail</span>
          {activityLog.slice(0, 5).map((item) => (
            <p key={item.id}>{item.text}</p>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default StudentExam
