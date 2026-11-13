
import './DeadlineAlerts.css'

function getDaysRemaining(endDate) {
  if (!endDate) return null

  const [year, month, day] = endDate.split('-')
  const deadline = new Date(year, month - 1, day)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.round(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function formatDate(date) {
  if (!date) return 'Date unavailable'

  const [year, month, day] = date.split('-')

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DeadlineAlerts({ projects = [] }) {
  const activeProjects = projects.filter(
    (project) =>
      String(project.status || '').trim().toUpperCase() !== 'COMPLETED'
  )

  const overdueProjects = activeProjects.filter((project) => {
    const days = getDaysRemaining(project.endDate)
    return days !== null && days < 0
  })

  const upcomingProjects = activeProjects.filter((project) => {
    const days = getDaysRemaining(project.endDate)
    return days !== null && days >= 0 && days <= 7
  })

  const onTrackProjects = activeProjects.filter((project) => {
    const days = getDaysRemaining(project.endDate)
    return days !== null && days > 7
  })

  function renderProject(project, category) {
    const days = getDaysRemaining(project.endDate)

    return (
      <div className="deadline-alert-item" key={project.id}>

        <div className="deadline-alert-info">
          <strong>{project.projectName}</strong>

          <span>
            Deadline: {formatDate(project.endDate)}
          </span>
        </div>

        <div className={`deadline-alert-badge ${category}`}>
          {category === 'overdue'
            ? `${Math.abs(days)} days overdue`
            : category === 'upcoming'
              ? days === 0
                ? 'Due today'
                : `${days} days left`
              : `${days} days left`}
        </div>

      </div>
    )
  }

  return (
    <section className="deadline-alert-section">

      <div className="deadline-alert-heading">
        <div>
          <h2>Smart Project Deadline Alerts</h2>
          <p>
            Monitor project deadlines and identify projects requiring attention.
          </p>
        </div>
      </div>

      <div className="deadline-alert-summary">

        <div className="deadline-summary-card overdue-card">
          <span>Overdue Projects</span>
          <h2>{overdueProjects.length}</h2>
        </div>

        <div className="deadline-summary-card upcoming-card">
          <span>Due Within 7 Days</span>
          <h2>{upcomingProjects.length}</h2>
        </div>

        <div className="deadline-summary-card ontrack-card">
          <span>On Track</span>
          <h2>{onTrackProjects.length}</h2>
        </div>

      </div>

      <div className="deadline-alert-lists">

        <div className="deadline-alert-panel">

          <h3>Overdue Projects</h3>

          {overdueProjects.length > 0 ? (
            overdueProjects.map((project) =>
              renderProject(project, 'overdue')
            )
          ) : (
            <p className="deadline-empty">
              No overdue projects. Great work!
            </p>
          )}

        </div>

        <div className="deadline-alert-panel">

          <h3>Upcoming Deadlines</h3>

          {upcomingProjects.length > 0 ? (
            upcomingProjects.map((project) =>
              renderProject(project, 'upcoming')
            )
          ) : (
            <p className="deadline-empty">
              No deadlines within the next 7 days.
            </p>
          )}

        </div>

        <div className="deadline-alert-panel">

          <h3>On Track Projects</h3>

          {onTrackProjects.length > 0 ? (
            onTrackProjects.map((project) =>
              renderProject(project, 'ontrack')
            )
          ) : (
            <p className="deadline-empty">
              No projects currently in this category.
            </p>
          )}

        </div>

      </div>

    </section>
  )
}

export default DeadlineAlerts
