import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import heroImage from './assets/hero.png'
import './App.css'
import { authService } from './services/authService'
import { examService } from './services/examService'
import { getApiError, SOCKET_URL } from './services/http'
import { proctorService } from './services/proctorService'
import { resultService } from './services/resultService'

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('exam_token')
    const user = localStorage.getItem('exam_user')
    return token && user ? { token, user: JSON.parse(user), loading: false } : { token: '', user: null, loading: false }
  })
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    async function restoreSession() {
      if (!auth.token) return

      try {
        const payload = await authService.me()
        setAuth((current) => ({ ...current, user: payload.user, loading: false }))
        localStorage.setItem('exam_user', JSON.stringify(payload.user))
      } catch {
        localStorage.removeItem('exam_token')
        localStorage.removeItem('exam_user')
        setAuth({ token: '', user: null, loading: false })
      }
    }

    restoreSession()
  }, [auth.token])

  function saveAuth(payload) {
    localStorage.setItem('exam_token', payload.token)
    localStorage.setItem('exam_user', JSON.stringify(payload.user))
    setAuth({ token: payload.token, user: payload.user, loading: false })
  }

  function logout() {
    localStorage.removeItem('exam_token')
    localStorage.removeItem('exam_user')
    setAuth({ token: '', user: null, loading: false })
    notify('Logged out')
  }

  return (
    <>
      {toast && <Toast toast={toast} />}
      <Routes>
        <Route path="/" element={<Navigate to={auth.user ? `/${auth.user.role}` : '/register'} replace />} />
        <Route path="/register" element={auth.user ? <Navigate to={`/${auth.user.role}`} replace /> : <AuthPage mode="register" notify={notify} />} />
        <Route path="/login" element={auth.user ? <Navigate to={`/${auth.user.role}`} replace /> : <AuthPage mode="login" notify={notify} onLogin={saveAuth} />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute auth={auth} role="teacher">
              <TeacherDashboard user={auth.user} logout={logout} notify={notify} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute auth={auth} role="student">
              <StudentDashboard user={auth.user} logout={logout} notify={notify} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams/:examId"
          element={
            <ProtectedRoute auth={auth} role="student">
              <AttemptExam user={auth.user} logout={logout} notify={notify} token={auth.token} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function ProtectedRoute({ auth, children, role }) {
  if (auth.loading) return <PageLoader />
  if (!auth.user) return <Navigate to="/login" replace />
  if (auth.user.role !== role) return <Navigate to={`/${auth.user.role}`} replace />
  return children
}

function AuthPage({ mode, notify, onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await authService.register(form)
        notify('Registration successful. Please login.')
        navigate('/login')
      } else {
        const payload = await authService.login({ email: form.email, password: form.password })
        onLogin(payload)
        notify('Login successful')
        navigate(`/${payload.user.role}`)
      }
    } catch (err) {
      const message = getApiError(err)
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" style={{ backgroundImage: `linear-gradient(90deg, rgba(12, 18, 32, 0.86), rgba(12, 18, 32, 0.42)), url(${heroImage})` }}>
        <div className="brand auth-brand">
          <div className="brand-mark">EP</div>
          <div>
            <strong>ExamProctor</strong>
            <span>Online examination system</span>
          </div>
        </div>
        <div>
          <span className="label light">{mode === 'register' ? 'Create account' : 'Secure login'}</span>
          <h1>{mode === 'register' ? 'Register before entering the exam system' : 'Login to your role dashboard'}</h1>
          <p>Teachers manage exams and results. Students attempt active exams and view their own scores.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div>
            <span className="eyebrow">{mode === 'register' ? 'Step 1' : 'Step 2'}</span>
            <h2>{mode === 'register' ? 'Registration' : 'Login'}</h2>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label>
                Full name
                <input value={form.name} onChange={(event) => update('name', event.target.value)} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} required />
            </label>
            {mode === 'register' && (
              <label>
                Role
                <select value={form.role} onChange={(event) => update('role', event.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
            </button>
          </form>

          <Link className="link-button" to={mode === 'register' ? '/login' : '/register'}>
            {mode === 'register' ? 'Already registered? Login' : 'Need an account? Register'}
          </Link>
        </div>
      </section>
    </main>
  )
}

function AppLayout({ children, logout, nav, title, user }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">EP</div>
          <div>
            <strong>ExamProctor</strong>
            <span>{user.role} dashboard</span>
          </div>
        </div>
        <nav className="nav-list">{nav}</nav>
        <div className="sidebar-panel">
          <span className="label">Signed in</span>
          <strong>{user.name}</strong>
          <p>{user.email}</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Online Examination System</span>
            <h1>{title}</h1>
          </div>
          <button className="ghost-button" onClick={logout}>
            Logout
          </button>
        </header>
        {children}
      </section>
    </main>
  )
}

function TeacherDashboard({ logout, notify, user }) {
  const [activeTab, setActiveTab] = useState('exams')
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [results, setResults] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTeacherData = useCallback(async () => {
    setLoading(true)
    try {
      const [examPayload, resultPayload, logPayload] = await Promise.all([
        examService.teacherExams(),
        resultService.teacherResults(),
        proctorService.logs(),
      ])
      setExams(examPayload.exams || [])
      setResults(resultPayload.results || [])
      setLogs(logPayload.logs || [])
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadTeacherData()
  }, [loadTeacherData])

  useEffect(() => {
    const token = localStorage.getItem('exam_token')
    if (!token) return undefined

    const socket = io(SOCKET_URL, { auth: { token } })
    socket.on('proctor-event', (payload) => {
      setLogs((current) => [payload.violation, ...current])
      notify(`Proctor alert: ${payload.violation.message}`, 'warning')
    })

    return () => socket.disconnect()
  }, [notify])

  const nav = (
    <>
      <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>Exams</button>
      <button className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>Results</button>
      <button className={activeTab === 'proctor' ? 'active' : ''} onClick={() => setActiveTab('proctor')}>Proctoring</button>
    </>
  )

  return (
    <AppLayout logout={logout} nav={nav} title="Teacher Dashboard" user={user}>
      {loading && <PageLoader />}
      {!loading && activeTab === 'exams' && (
        <TeacherExamManager
          exams={exams}
          notify={notify}
          onChanged={loadTeacherData}
          selectedExam={selectedExam}
          setSelectedExam={setSelectedExam}
        />
      )}
      {!loading && activeTab === 'results' && <TeacherResults results={results} />}
      {!loading && activeTab === 'proctor' && <ProctorLogs logs={logs} />}
    </AppLayout>
  )
}

function TeacherExamManager({ exams, notify, onChanged, selectedExam, setSelectedExam }) {
  const emptyQuestion = { question: '', optionsText: '', correctAnswer: '', marks: 1 }
  const [form, setForm] = useState({ title: '', description: '', duration: 30, passingMarks: 0, isActive: true })
  const [questions, setQuestions] = useState([emptyQuestion])
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState(null)

  // Calculate statistics
  const totalExams = exams.length
  const activeExams = exams.filter(e => e.isActive).length
  const totalSubmissions = exams.reduce((sum, e) => sum + e.attemptCount, 0)
  const totalQuestions = exams.reduce((sum, e) => sum + e.questionCount, 0)

  async function loadDetails(exam) {
    setSelectedExam(exam)
    const payload = await examService.details(exam._id)
    setDetails(payload)
    setForm({
      title: payload.exam.title,
      description: payload.exam.description || '',
      duration: payload.exam.duration,
      passingMarks: payload.exam.passingMarks,
      isActive: payload.exam.isActive,
    })
  }

  function addQuestionField() {
    setQuestions((current) => [...current, emptyQuestion])
  }

  function updateQuestion(index, field, value) {
    setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)))
  }

  async function createExam(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await examService.create({
        ...form,
        questions: questions
          .filter((item) => item.question && item.optionsText && item.correctAnswer)
          .map((item) => ({
            question: item.question,
            options: item.optionsText.split('\n').map((option) => option.trim()).filter(Boolean),
            correctAnswer: item.correctAnswer,
            marks: Number(item.marks || 1),
          })),
      })
      notify('✅ Exam created and saved successfully!')
      setForm({ title: '', description: '', duration: 30, passingMarks: 0, isActive: true })
      setQuestions([emptyQuestion])
      onChanged()
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateExam(event) {
    event.preventDefault()
    if (!selectedExam) return
    setSaving(true)
    try {
      await examService.update(selectedExam._id, form)
      notify('✅ Exam updated successfully!')
      onChanged()
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteExam(id) {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return
    try {
      await examService.remove(id)
      notify('✅ Exam deleted successfully!')
      setSelectedExam(null)
      setDetails(null)
      onChanged()
    } catch (err) {
      notify(getApiError(err), 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Exams</span>
          <h3 className="stat-value">{totalExams}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Exams</span>
          <h3 className="stat-value" style={{ color: '#10b981' }}>{activeExams}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Submissions</span>
          <h3 className="stat-value" style={{ color: '#3b82f6' }}>{totalSubmissions}</h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Questions</span>
          <h3 className="stat-value" style={{ color: '#8b5cf6' }}>{totalQuestions}</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="table-header">
            <div>
              <span className="label">Exam management</span>
              <h2>{selectedExam ? 'Edit exam' : 'Create new exam'}</h2>
            </div>
            {selectedExam && <button className="ghost-button" onClick={() => { setSelectedExam(null); setDetails(null); setForm({ title: '', description: '', duration: 30, passingMarks: 0, isActive: true }); setQuestions([emptyQuestion]) }}>Create New</button>}
          </div>
          <ExamForm form={form} setForm={setForm} onSubmit={selectedExam ? updateExam : createExam} saving={saving} buttonText={selectedExam ? 'Update exam' : 'Create exam'} />
          {!selectedExam && (
            <div className="question-builder">
              <div className="table-header">
                <h2>Add Questions</h2>
                <button className="ghost-button" onClick={addQuestionField}>+ Add Question</button>
              </div>
              {questions.map((item, index) => (
                <QuestionForm key={index} index={index} item={item} updateQuestion={updateQuestion} />
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="table-header">
            <div>
              <span className="label">Your exams</span>
              <h2>{exams.length} created</h2>
            </div>
          </div>
          <div className="exam-list">
            {exams.map((exam) => (
              <article className="exam-card" key={exam._id} style={{ borderLeft: exam.isActive ? '4px solid #10b981' : '4px solid #6b7280' }}>
                <div className="exam-header">
                  <div>
                    <strong>{exam.title}</strong>
                    <span className="exam-status">{exam.isActive ? '🟢 Active' : '⚫ Inactive'}</span>
                  </div>
                </div>
                <div className="exam-details">
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{exam.duration} min</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Marks:</span>
                    <span className="detail-value">{exam.totalMarks}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Passing Marks:</span>
                    <span className="detail-value">{exam.passingMarks}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Questions:</span>
                    <span className="detail-value">{exam.questionCount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Attempts:</span>
                    <span className="detail-value">{exam.attemptCount}</span>
                  </div>
                </div>
                <div className="exam-actions">
                  <button className="btn-secondary" onClick={() => loadDetails(exam)}>Edit</button>
                  <button className="btn-danger" onClick={() => deleteExam(exam._id)}>Delete</button>
                </div>
              </article>
            ))}
            {!exams.length && <EmptyState text="No exams created yet. Create your first exam to get started!" />}
          </div>
          {details && <QuestionManager details={details} notify={notify} reload={() => loadDetails(selectedExam)} />}
        </section>
      </div>
    </div>
  )
}

function ExamForm({ buttonText, form, onSubmit, saving, setForm }) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <form className="app-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title Field */}
      <div className="form-group">
        <label className="form-label">Exam Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
          placeholder="e.g., Mathematics Final Exam"
          required
          className="form-input"
          style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="Enter exam description (optional)"
          className="form-input"
          style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '100px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Duration and Passing Marks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <input
            type="text"
            inputMode="numeric"
            value={form.duration}
            onChange={(event) => {
              const val = event.target.value
              if (val === '' || /^\d+$/.test(val)) {
                update('duration', val === '' ? 0 : Number(val))
              }
            }}
            placeholder="30"
            required
            className="form-input"
            style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Passing Marks</label>
          <input
            type="text"
            inputMode="numeric"
            value={form.passingMarks}
            onChange={(event) => {
              const val = event.target.value
              if (val === '' || /^\d+$/.test(val)) {
                update('passingMarks', val === '' ? 0 : Number(val))
              }
            }}
            placeholder="0"
            required
            className="form-input"
            style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => update('isActive', event.target.checked)}
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
        <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
          {form.isActive ? '🟢 Active - Students can attempt' : '⚫ Inactive - Students cannot attempt'}
        </label>
      </div>

      {/* Submit Button */}
      <button
        className="primary-button"
        disabled={saving}
        style={{ padding: '12px 24px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? '⏳ Saving...' : buttonText}
      </button>
    </form>
  )
}

function QuestionForm({ index, item, updateQuestion }) {
  return (
    <div className="question-card" style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label className="form-label">Question #{index + 1}</label>
        <input
          value={item.question}
          onChange={(event) => updateQuestion(index, 'question', event.target.value)}
          placeholder="Enter your question here"
          className="form-input"
          style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label className="form-label">Answer Options</label>
        <textarea
          value={item.optionsText}
          onChange={(event) => updateQuestion(index, 'optionsText', event.target.value)}
          placeholder="Enter each option on a separate line&#10;e.g.&#10;Option A&#10;Option B&#10;Option C&#10;Option D"
          className="form-input"
          style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%', minHeight: '120px', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
        <div>
          <label className="form-label">Correct Answer</label>
          <input
            value={item.correctAnswer}
            onChange={(event) => updateQuestion(index, 'correctAnswer', event.target.value)}
            placeholder="e.g., Option A"
            className="form-input"
            style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%' }}
          />
        </div>

        <div>
          <label className="form-label">Marks</label>
          <input
            type="text"
            inputMode="numeric"
            value={item.marks}
            onChange={(event) => {
              const val = event.target.value
              if (val === '' || /^\d+$/.test(val)) {
                updateQuestion(index, 'marks', val === '' ? 0 : Number(val))
              }
            }}
            placeholder="1"
            className="form-input"
            style={{ fontSize: '16px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

function QuestionManager({ details, notify, reload }) {
  async function removeQuestion(questionId) {
    try {
      await examService.deleteQuestion(questionId)
      notify('Question deleted')
      reload()
    } catch (err) {
      notify(getApiError(err), 'error')
    }
  }

  return (
    <div className="question-builder">
      <h2>Saved questions</h2>
      {details.questions.map((question) => (
        <article className="list-item" key={question._id}>
          <div>
            <strong>{question.question}</strong>
            <span>{question.options.join(', ')} | Answer: {question.correctAnswer} | Marks: {question.marks}</span>
          </div>
          <button className="danger-button" onClick={() => removeQuestion(question._id)}>Delete</button>
        </article>
      ))}
    </div>
  )
}

function TeacherResults({ results }) {
  return (
    <section className="panel">
      <div className="table-header">
        <div>
          <span className="label">Results management</span>
          <h2>Student submissions</h2>
        </div>
      </div>
      <DataTable
        columns={['Student', 'Exam', 'Score', 'Percentage', 'Status', 'Submitted']}
        rows={results.map((result) => [
          result.studentId?.name,
          result.examId?.title,
          `${result.score}/${result.totalMarks}`,
          `${result.percentage}%`,
          result.status,
          formatDate(result.submittedAt),
        ])}
      />
    </section>
  )
}

function ProctorLogs({ logs }) {
  return (
    <section className="panel">
      <div className="table-header">
        <div>
          <span className="label">Proctoring</span>
          <h2>Live activity logs</h2>
        </div>
      </div>
      <DataTable
        columns={['Student', 'Exam', 'Type', 'Message', 'Time']}
        rows={logs.map((log) => [
          log.studentId?.name || 'Student',
          log.examId?.title || 'Exam',
          log.type,
          log.message,
          formatDate(log.timestamp),
        ])}
      />
    </section>
  )
}

function StudentDashboard({ logout, notify, user }) {
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const loadStudentData = useCallback(async () => {
    setLoading(true)
    try {
      const [examPayload, resultPayload] = await Promise.all([examService.activeExams(), resultService.myResults()])
      setExams(examPayload.exams || [])
      setResults(resultPayload.results || [])
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  const attemptedExamIds = new Set(results.map(r => r.examId?._id))

  return (
    <AppLayout logout={logout} nav={<Link className="nav-link active" to="/student">Dashboard</Link>} title="Student Dashboard" user={user}>
      {loading && <PageLoader />}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Available Exams Section */}
          <section>
            <div style={{ marginBottom: '20px' }}>
              <span className="label">📝 Available Exams</span>
              <h2 style={{ marginTop: '4px', marginBottom: '4px' }}>Active Exams</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Click "Attempt Exam" to start taking a test</p>
            </div>

            {exams.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {exams.map((exam) => {
                  const isAttempted = attemptedExamIds.has(exam._id)
                  return (
                    <div
                      key={exam._id}
                      className="exam-card"
                      style={{
                        padding: '20px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        ':hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
                      }}
                    >
                      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{exam.title}</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af' }}>Duration</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>⏱️ {exam.duration} min</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af' }}>Total Marks</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>⭐ {exam.totalMarks}</span>
                        </div>
                      </div>

                      {exam.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', margin: 0, paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
                          {exam.description}
                        </p>
                      )}

                      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', margin: 0, paddingTop: '12px' }}>
                        By: {exam.createdBy?.name}
                      </p>

                      {isAttempted ? (
                        <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', textAlign: 'center', color: '#92400e', fontWeight: '600', fontSize: '14px' }}>
                          ✅ Already Attempted
                        </div>
                      ) : (
                        <Link
                          to={`/student/exams/${exam._id}`}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                          🚀 Attempt Exam
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState text="✨ No active exams available at the moment. Check back later!" />
            )}
          </section>

          {/* Results Section */}
          <section>
            <div style={{ marginBottom: '20px' }}>
              <span className="label">📊 Your Results</span>
              <h2 style={{ marginTop: '4px', marginBottom: '4px' }}>Score History</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>View your exam scores and performance</p>
            </div>

            {results.length > 0 ? (
              <DataTable
                columns={['Exam', 'Score', 'Percentage', 'Status', 'Submitted']}
                rows={results.map((result) => [
                  result.examId?.title,
                  `${result.score}/${result.totalMarks}`,
                  `${result.percentage}%`,
                  result.status,
                  formatDate(result.submittedAt),
                ])}
              />
            ) : (
              <EmptyState text="📋 You haven't submitted any exams yet. Complete an exam above to see your results here!" />
            )}
          </section>
        </div>
      )}
    </AppLayout>
  )
}

const violationCopy = {
  'tab-switch': {
    title: 'Tab switching detected',
    message: 'You moved away from the exam tab. Please stay on this test screen while answering.',
  },
  'focus-loss': {
    title: 'Exam focus lost',
    message: 'The exam window is no longer active. Keep the test window focused until submission.',
  },
  'webcam-violation': {
    title: 'Webcam violation detected',
    message: 'A webcam issue was recorded. Make sure your camera is visible and active during the exam.',
  },
}

function AttemptExam({ logout, notify, token, user }) {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState(null)
  const [answers, setAnswers] = useState({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [violationPopup, setViolationPopup] = useState(null)
  const violationTimerRef = useRef(null)

  const showViolationPopup = useCallback((type) => {
    const copy = violationCopy[type] || {
      title: 'Proctoring warning',
      message: 'A proctoring rule violation was recorded for this attempt.',
    }

    window.clearTimeout(violationTimerRef.current)
    setViolationPopup({ ...copy, type })
    violationTimerRef.current = window.setTimeout(() => setViolationPopup(null), 6500)
  }, [])

  const closeViolationPopup = useCallback(() => {
    window.clearTimeout(violationTimerRef.current)
    setViolationPopup(null)
  }, [])

  useEffect(() => {
    async function loadExam() {
      try {
        const data = await examService.details(examId)
        setPayload(data)
      } catch (err) {
        notify(getApiError(err), 'error')
        navigate('/student')
      }
    }

    loadExam()
  }, [examId, navigate, notify])

  useEffect(() => () => window.clearTimeout(violationTimerRef.current), [])

  useEffect(() => {
    if (!payload || !token) return undefined

    const socket = io(SOCKET_URL, { auth: { token } })
    socket.emit('join-exam', { examId })

    async function recordFocusLoss() {
      if (document.hidden) return

      showViolationPopup('focus-loss')
      try {
        await proctorService.focusLoss({ examId, message: 'Exam window lost focus' })
        socket.emit('proctor-event', { examId, type: 'focus-loss', message: 'Exam window lost focus' })
        notify('Focus loss recorded', 'warning')
      } catch (err) {
        notify(getApiError(err), 'error')
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        showViolationPopup('tab-switch')
        proctorService.tabSwitch({ examId, message: 'Student switched tabs' }).catch((err) => notify(getApiError(err), 'error'))
        socket.emit('proctor-event', { examId, type: 'tab-switch', message: 'Student switched tabs' })
        notify('Tab switch recorded', 'warning')
      }
    }

    window.addEventListener('blur', recordFocusLoss)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('blur', recordFocusLoss)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      socket.disconnect()
    }
  }, [examId, notify, payload, showViolationPopup, token])

  if (!payload) return <PageLoader />

  const question = payload.questions[activeIndex]

  async function submitExam() {
    setSubmitting(true)
    try {
      const result = await resultService.submit({
        examId,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      })
      notify(`Submitted. Score: ${result.result.score}/${result.result.totalMarks}`)
      navigate('/student')
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function recordWebcamViolation() {
    showViolationPopup('webcam-violation')
    proctorService.webcamViolation({ examId, message: 'Webcam suspicious activity' })
      .then(() => notify('Webcam event recorded', 'warning'))
      .catch((err) => notify(getApiError(err), 'error'))
  }

  return (
    <AppLayout logout={logout} nav={<Link className="nav-link" to="/student">Back to dashboard</Link>} title={payload.exam.title} user={user}>
      {violationPopup && <ViolationPopup warning={violationPopup} onClose={closeViolationPopup} />}
      <div className="student-grid">
        <section className="panel">
          <div className="exam-meta">
            <span>Question {activeIndex + 1} of {payload.questions.length}</span>
            <span>{Object.keys(answers).length}/{payload.questions.length} answered</span>
          </div>
          <h2>{question.question}</h2>
          <div className="answer-list">
            {question.options.map((option, index) => (
              <button key={option} className={answers[question._id] === option ? 'selected' : ''} onClick={() => setAnswers((current) => ({ ...current, [question._id]: option }))}>
                <span>{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            ))}
          </div>
          <footer className="exam-controls">
            <button disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => index - 1)}>Previous</button>
            <button disabled={activeIndex === payload.questions.length - 1} onClick={() => setActiveIndex((index) => index + 1)}>Next</button>
            <button className="primary-button" disabled={submitting} onClick={submitExam}>{submitting ? 'Submitting...' : 'Submit exam'}</button>
          </footer>
        </section>
        <aside className="monitor-panel">
          <div className="camera-card">
            <div className="camera-lens" />
            <span className="camera-badge online">Proctoring active</span>
          </div>
          <button className="danger-button" onClick={recordWebcamViolation}>
            Report webcam issue
          </button>
        </aside>
      </div>
    </AppLayout>
  )
}

function ViolationPopup({ onClose, warning }) {
  return (
    <div className="violation-overlay" role="alertdialog" aria-modal="true" aria-labelledby="violation-title">
      <div className="violation-popup">
        <div className="violation-icon">!</div>
        <div>
          <span className="label">Proctoring warning</span>
          <h2 id="violation-title">{warning.title}</h2>
          <p>{warning.message}</p>
        </div>
        <button className="ghost-button" onClick={onClose}>I understand</button>
      </div>
    </div>
  )
}

function DataTable({ columns, rows }) {
  if (!rows.length) return <EmptyState text="No records found." />

  return (
    <div className="result-table">
      <div className="table-row table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))` }}>
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      {rows.map((row, index) => (
        <div className="table-row" key={index} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))` }}>
          {row.map((cell, cellIndex) => <span key={cellIndex}>{cell || '-'}</span>)}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="empty-state">{text}</p>
}

function PageLoader() {
  return <div className="page-loader">Loading...</div>
}

function Toast({ toast }) {
  return <div className={`toast ${toast.type}`}>{toast.message}</div>
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default App
