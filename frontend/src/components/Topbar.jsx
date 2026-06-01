function Topbar({ isSubmitted, onFlagEvent, title }) {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Online mock test</span>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <span className={`status-pill ${isSubmitted ? 'danger' : 'ok'}`}>
          {isSubmitted ? 'Submitted' : 'Monitoring active'}
        </span>
        <button className="ghost-button" onClick={onFlagEvent}>
          Flag event
        </button>
      </div>
    </header>
  )
}

export default Topbar
