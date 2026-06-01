function Sidebar({ currentView, onViewChange }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <div className="brand-mark">EP</div>
        <div>
          <strong>ExamProctor</strong>
          <span>Integrity console</span>
        </div>
      </div>

      <nav className="nav-list">
        <button className={currentView === 'student' ? 'active' : ''} onClick={() => onViewChange('student')}>
          <span className="nav-icon nav-icon-dot" aria-hidden="true" />
          Student test
        </button>
        <button className={currentView === 'teacher' ? 'active' : ''} onClick={() => onViewChange('teacher')}>
          <span className="nav-icon nav-icon-diamond" aria-hidden="true" />
          Teacher analytics
        </button>
      </nav>

      <div className="sidebar-panel">
        <span className="label">Live session</span>
        <strong>Mock Test: CS Fundamentals</strong>
        <p>Auto-submit at 3 verified violations.</p>
      </div>
    </aside>
  )
}

export default Sidebar
