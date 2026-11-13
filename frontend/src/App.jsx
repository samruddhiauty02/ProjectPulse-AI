
import { useEffect, useState } from 'react'
import './App.css'
import Projects from './Projects'
import Procurements from './Procurements'
import BudgetAnalytics from './BudgetAnalytics'
import AIAssistant from './AIAssistant'
import DashboardCharts from './DashboardCharts'
import DeadlineAlerts from './DeadlineAlerts'
import AIInsights from './AIInsights'
import AIRiskAssessment from './AIRiskAssessment'

const API_URL = 'http://localhost:8080/api/projects'
const PROCUREMENT_API = 'http://localhost:8080/api/procurements'

const emptyForm = {
  projectName: '',
  description: '',
  budget: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(date) {
  if (!date) return 'Not specified'

  const [year, month, day] = date.split('-')

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const [projects, setProjects] = useState([])
  const [summary, setSummary] = useState({})
  const [totalBudget, setTotalBudget] = useState(0)
  const [procurements, setProcurements] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError('')

      const [
        projectsResponse,
        summaryResponse,
        budgetResponse,
        procurementResponse,
      ] = await Promise.all([
        fetch(API_URL),
        fetch(`${API_URL}/progress-summary`),
        fetch(`${API_URL}/total-budget`),
        fetch(PROCUREMENT_API),
      ])

      if (
        !projectsResponse.ok ||
        !summaryResponse.ok ||
        !budgetResponse.ok ||
        !procurementResponse.ok
      ) {
        throw new Error('Unable to retrieve dashboard information.')
      }

      const projectsData = await projectsResponse.json()
      const summaryData = await summaryResponse.json()
      const budgetData = await budgetResponse.json()
      const procurementData = await procurementResponse.json()

      setProjects(projectsData)
      setSummary(summaryData)
      setTotalBudget(Number(budgetData))
      setProcurements(procurementData)

    } catch (err) {
      console.error('Dashboard API error:', err)

      setError(
        'Unable to connect to the backend. Check that Spring Boot is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // FINANCIAL KPI CALCULATIONS

  const totalProcurement = procurements.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  )

  const pendingAmount = procurements
    .filter(
      (item) =>
        String(item.status || '').trim().toUpperCase() === 'PENDING'
    )
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    )

  const approvedAmount = procurements
    .filter(
      (item) =>
        String(item.status || '').trim().toUpperCase() === 'APPROVED'
    )
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    )

  const paidAmount = procurements
    .filter(
      (item) =>
        String(item.status || '').trim().toUpperCase() === 'PAID'
    )
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    )

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setFormError('')
    setSuccessMessage('')

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be earlier than start date.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const messages = errorData?.messages

        if (messages) {
          throw new Error(Object.values(messages).join(', '))
        }

        throw new Error(
          errorData?.message || 'Unable to create project.'
        )
      }

      await response.json()

      setFormData(emptyForm)
      setShowForm(false)
      setSuccessMessage('Project created successfully!')

      await fetchDashboardData()

    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function navigateTo(page) {
    setActivePage(page)
    setSuccessMessage('')
    setError('')
  }

  return (
    <div className="app">

      {/* PREMIUM SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">P</div>
          <h2 className="logo">
            ProjectPulse<span> AI</span>
          </h2>
        </div>

        <div className="sidebar-menu">

          <p className="menu-title">WORKSPACE</p>

          <nav className="sidebar-nav">

            <a
              href="#"
              className={activePage === 'Dashboard' ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('Dashboard')
              }}
            >
              <span className="nav-icon">▦</span>
              <span>Dashboard</span>
            </a>

            <a
              href="#"
              className={activePage === 'Projects' ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('Projects')
              }}
            >
              <span className="nav-icon">▣</span>
              <span>Projects</span>
            </a>

            <a
              href="#"
              className={activePage === 'Procurement' ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('Procurement')
              }}
            >
              <span className="nav-icon">⇄</span>
              <span>Procurement</span>
            </a>

            <a
              href="#"
              className={activePage === 'Budget Analytics' ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('Budget Analytics')
              }}
            >
              <span className="nav-icon">▤</span>
              <span>Budget Analytics</span>
            </a>

            <a
              href="#"
              className={activePage === 'AI Assistant' ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('AI Assistant')
              }}
            >
              <span className="nav-icon">✧</span>
              <span>AI Assistant</span>
              <span className="ai-label">AI</span>
            </a>

          </nav>

        </div>

        <div className="sidebar-bottom">

          <p className="menu-title">SUPPORT</p>

          <a href="#" onClick={(event) => event.preventDefault()}>
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </a>

          <a href="#" onClick={(event) => event.preventDefault()}>
            <span className="nav-icon">?</span>
            <span>Help & Support</span>
          </a>

          <div className="sidebar-footer">
            <div className="sidebar-footer-icon">SA</div>
            <div>
              <strong>ProjectPulse AI</strong>
              <span>Enterprise Workspace</span>
            </div>
          </div>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="topbar">

          <div>

            <h2>
              {activePage === 'Dashboard'
                ? 'Dashboard Overview'
                : activePage === 'Projects'
                  ? 'Project Management'
                  : activePage === 'Procurement'
                    ? 'Procurement Management'
                    : activePage}
            </h2>

            <p>
              {activePage === 'Dashboard'
                ? "Welcome back! Here's what's happening today."
                : activePage === 'Projects'
                  ? 'Manage and track all your projects in one place.'
                  : activePage === 'Procurement'
                    ? 'Manage vendors, procurement requests and expenses.'
                    : activePage === 'Budget Analytics'
                      ? 'Analyze project budgets and procurement spending.'
                      : activePage === 'AI Assistant'
                        ? 'Your intelligent assistant for project and procurement management.'
                        : 'Explore your enterprise management workspace.'}
            </p>

          </div>

          <div className="profile">SA</div>

        </header>

        {/* DASHBOARD PAGE */}
        {activePage === 'Dashboard' ? (

          <>

            <section className="welcome">

              <div>
                <h1>Project Dashboard</h1>

                <p>
                  Monitor your projects, budgets and procurement activities.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  setFormError('')
                  setShowForm(true)
                }}
              >
                + New Project
              </button>

            </section>

            {error && (
              <p className="error-message">{error}</p>
            )}

            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}

            {/* PROJECT ANALYTICS CARDS */}
            <section className="stats-grid">

              <div className="stat-card">
                <p>Total Projects</p>

                <h2>
                  {loading ? '...' : summary.totalProjects ?? 0}
                </h2>

                <span>All registered projects</span>
              </div>

              <div className="stat-card">
                <p>In Progress</p>

                <h2>
                  {loading ? '...' : summary.inProgressProjects ?? 0}
                </h2>

                <span>Currently active projects</span>
              </div>

              <div className="stat-card">
                <p>Completed</p>

                <h2>
                  {loading ? '...' : summary.completedProjects ?? 0}
                </h2>

                <span>Successfully completed</span>
              </div>

              <div className="stat-card">
                <p>Total Budget</p>

                <h2>
                  {loading ? '...' : formatCurrency(totalBudget)}
                </h2>

                <span>Across all projects</span>
              </div>

            </section>

            {/* FINANCIAL KPI CARDS */}
            <section className="financial-kpi-section">

              <div className="financial-kpi-heading">
                <h2>Procurement Financial Overview</h2>
                <p>
                  Live financial insights from all procurement requests.
                </p>
              </div>

              <div className="financial-kpi-grid">

                <div className="financial-kpi-card kpi-blue">

                  <div className="financial-kpi-top">
                    <p className="financial-kpi-label">
                      Total Procurement
                    </p>

                    <div className="financial-kpi-icon">₹</div>
                  </div>

                  <h2 className="financial-kpi-value">
                    {loading ? '...' : formatCurrency(totalProcurement)}
                  </h2>

                  <p className="financial-kpi-description">
                    Total value of all requests
                  </p>

                </div>

                <div className="financial-kpi-card kpi-orange">

                  <div className="financial-kpi-top">
                    <p className="financial-kpi-label">
                      Pending Requests
                    </p>

                    <div className="financial-kpi-icon">◷</div>
                  </div>

                  <h2 className="financial-kpi-value">
                    {loading ? '...' : formatCurrency(pendingAmount)}
                  </h2>

                  <p className="financial-kpi-description">
                    Awaiting approval
                  </p>

                </div>

                <div className="financial-kpi-card kpi-purple">

                  <div className="financial-kpi-top">
                    <p className="financial-kpi-label">
                      Approved Commitments
                    </p>

                    <div className="financial-kpi-icon">✓</div>
                  </div>

                  <h2 className="financial-kpi-value">
                    {loading ? '...' : formatCurrency(approvedAmount)}
                  </h2>

                  <p className="financial-kpi-description">
                    Approved, not necessarily paid
                  </p>

                </div>

                <div className="financial-kpi-card kpi-green">

                  <div className="financial-kpi-top">
                    <p className="financial-kpi-label">
                      Actual Expenses
                    </p>

                    <div className="financial-kpi-icon">↗</div>
                  </div>

                  <h2 className="financial-kpi-value">
                    {loading ? '...' : formatCurrency(paidAmount)}
                  </h2>

                  <p className="financial-kpi-description">
                    Successfully paid procurement
                  </p>

                </div>

              </div>

            </section>

            {/* SMART PROJECT DEADLINE ALERTS */}
            <DeadlineAlerts projects={projects} />

            {/* AI-POWERED BUSINESS INSIGHTS */}
            <AIInsights />

            <AIRiskAssessment />

            {/* RECENT PROJECTS */}
            <section className="content-card">

              <div className="section-heading">

                <div>
                  <h2>Recent Projects</h2>
                  <p>Overview of your latest projects</p>
                </div>

                <button
                  className="secondary-btn"
                  onClick={fetchDashboardData}
                >
                  Refresh
                </button>

              </div>

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>PROJECT NAME</th>
                      <th>BUDGET</th>
                      <th>STATUS</th>
                      <th>DEADLINE</th>
                    </tr>
                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>
                        <td colSpan="4">Loading projects...</td>
                      </tr>

                    ) : projects.length > 0 ? (

                      projects.map((project) => (

                        <tr key={project.id}>

                          <td>{project.projectName}</td>

                          <td>
                            {formatCurrency(Number(project.budget))}
                          </td>

                          <td>
                            <span className="status">
                              {project.status.replaceAll('_', ' ')}
                            </span>
                          </td>

                          <td>{formatDate(project.endDate)}</td>

                        </tr>

                      ))

                    ) : (

                      <tr>
                        <td colSpan="4">No projects found.</td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* DASHBOARD VISUAL ANALYTICS */}
            <DashboardCharts />

            {/* LOWER SECTION */}
            <section className="bottom-grid">

              <div className="content-card">

                <h3>Budget Overview</h3>

                <p className="muted">Total allocated budget</p>

                <h2>
                  {loading ? '...' : formatCurrency(totalBudget)}
                </h2>

                <div className="progress-track">
                  <div className="progress-fill"></div>
                </div>

                <p className="muted">
                  Total budget across all registered projects.
                </p>

              </div>

              <div className="content-card">

                <h3>Project Deadlines</h3>

                <p className="muted">Project milestones</p>

                {loading ? (

                  <p className="muted">Loading deadlines...</p>

                ) : projects.length > 0 ? (

                  projects.map((project) => (

                    <div className="deadline" key={project.id}>

                      <strong>{project.projectName}</strong>

                      <span>{formatDate(project.endDate)}</span>

                    </div>

                  ))

                ) : (

                  <p className="muted">
                    No project deadlines available.
                  </p>

                )}

              </div>

            </section>

            <footer>
              © 2026 ProjectPulse AI. All rights reserved.
            </footer>

          </>

        ) : activePage === 'Projects' ? (

          <Projects />

        ) : activePage === 'Procurement' ? (

          <Procurements />

        ) : activePage === 'Budget Analytics' ? (

          <BudgetAnalytics />

        ) : activePage === 'AI Assistant' ? (

          <AIAssistant />

        ) : (

          <section className="content-card">

            <h2>{activePage}</h2>

            <p>
              This section will be developed in a later step.
            </p>

          </section>

        )}

      </main>

      {/* NEW PROJECT FORM */}
      {showForm && (

        <div className="modal-overlay">

          <div className="project-modal">

            <div className="modal-header">

              <div>
                <h2>Create New Project</h2>
                <p>Enter the details of your new project.</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowForm(false)}
                type="button"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>Project Name *</label>

              <input
                type="text"
                name="projectName"
                placeholder="Enter project name"
                value={formData.projectName}
                onChange={handleInputChange}
                maxLength="150"
                required
              />

              <label>Description</label>

              <textarea
                name="description"
                placeholder="Describe your project"
                value={formData.description}
                onChange={handleInputChange}
                maxLength="1000"
                rows="3"
              />

              <label>Project Budget (₹) *</label>

              <input
                type="number"
                name="budget"
                placeholder="Enter budget"
                value={formData.budget}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />

              <div className="form-row">

                <div>
                  <label>Start Date *</label>

                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label>End Date *</label>

                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate || undefined}
                    required
                  />
                </div>

              </div>

              <label>Project Status *</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {formError && (
                <p className="error-message">{formError}</p>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Create Project'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default App