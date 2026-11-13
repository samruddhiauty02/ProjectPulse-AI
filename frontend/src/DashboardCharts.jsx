
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="content-card chart-card">
      <div className="chart-card-heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Bar({ label, amount, max, color, displayValue }) {
  const width = max > 0
    ? Math.min((Number(amount || 0) / max) * 100, 100)
    : 0

  return (
    <div className="chart-bar">
      <div className="chart-bar-heading">
        <strong>{label}</strong>
        <span>{displayValue}</span>
      </div>

      <div className="chart-bar-track">
        <div
          className="chart-bar-fill"
          style={{
            width: `${width}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

function LegendItem({ color, label, value }) {
  return (
    <div className="chart-legend-item">
      <span className="chart-legend-label">
        <span
          className="chart-legend-dot"
          style={{ background: color }}
        />
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  )
}

function DashboardCharts() {
  const [projects, setProjects] = useState([])
  const [procurements, setProcurements] = useState([])
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError('')

      const [projectResponse, procurementResponse] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/procurements`),
      ])

      if (!projectResponse.ok || !procurementResponse.ok) {
        throw new Error('Unable to load dashboard analytics.')
      }

      const projectData = await projectResponse.json()
      const procurementData = await procurementResponse.json()

      setProjects(projectData)
      setProcurements(procurementData)

      const summaryData = await Promise.all(
        projectData.map(async (project) => {
          try {
            const response = await fetch(
              `${API_URL}/projects/${project.id}/procurement-summary`
            )

            if (!response.ok) return null

            return await response.json()
          } catch {
            return null
          }
        })
      )

      setSummaries(summaryData.filter(Boolean))
    } catch (err) {
      setError(err.message || 'Something went wrong while loading analytics.')
    } finally {
      setLoading(false)
    }
  }

  const projectStatuses = [
    {
      label: 'In Progress',
      value: projects.filter(
        (p) => p.status?.toUpperCase() === 'IN_PROGRESS'
      ).length,
      color: '#4f46e5',
    },
    {
      label: 'Completed',
      value: projects.filter(
        (p) => p.status?.toUpperCase() === 'COMPLETED'
      ).length,
      color: '#10b981',
    },
    {
      label: 'On Hold',
      value: projects.filter(
        (p) => p.status?.toUpperCase() === 'ON_HOLD'
      ).length,
      color: '#f59e0b',
    },
    {
      label: 'Pending',
      value: projects.filter(
        (p) => p.status?.toUpperCase() === 'PENDING'
      ).length,
      color: '#94a3b8',
    },
  ]

  const procurementStatuses = [
    {
      label: 'Pending',
      value: procurements.filter(
        (p) => p.status?.toUpperCase() === 'PENDING'
      ).length,
      color: '#f59e0b',
    },
    {
      label: 'Approved',
      value: procurements.filter(
        (p) => p.status?.toUpperCase() === 'APPROVED'
      ).length,
      color: '#4f46e5',
    },
    {
      label: 'Paid',
      value: procurements.filter(
        (p) => p.status?.toUpperCase() === 'PAID'
      ).length,
      color: '#10b981',
    },
    {
      label: 'Rejected',
      value: procurements.filter(
        (p) => p.status?.toUpperCase() === 'REJECTED'
      ).length,
      color: '#ef4444',
    },
  ]

  const totalBudget = projects.reduce(
    (sum, project) => sum + Number(project.budget || 0),
    0
  )

  const actualSpent = summaries.reduce(
    (sum, item) => sum + Number(item.actualSpent || 0),
    0
  )

  const committedAmount = summaries.reduce(
    (sum, item) => sum + Number(item.committedAmount || 0),
    0
  )

  const remainingBudget = Math.max(totalBudget - actualSpent, 0)

  const maxProcurementStatus = Math.max(
    ...procurementStatuses.map((item) => item.value),
    1
  )

  const maxProjectBudget = Math.max(
    ...projects.map((project) => Number(project.budget || 0)),
    1
  )

  const totalProjects = projects.length

  const donutGradient = (() => {
    const total = projectStatuses.reduce(
      (sum, item) => sum + item.value,
      0
    )

    if (total === 0) return '#e9eef5 0% 100%'

    let current = 0

    return projectStatuses.map((item) => {
      const start = current
      current += (item.value / total) * 100

      return `${item.color} ${start}% ${current}%`
    }).join(', ')
  })()

  if (loading) {
    return (
      <div className="content-card">
        <p>Loading business intelligence analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-card">
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={loadDashboardData}>Try Again</button>
      </div>
    )
  }

  return (
    <section className="dashboard-charts-section">
      <div className="section-heading">
        <div>
          <h2>Business Intelligence & Analytics</h2>
          <p>Monitor project performance and financial activity across your portfolio.</p>
        </div>
      </div>

      <div className="charts-grid">

        {/* PROJECT STATUS DISTRIBUTION */}
        <ChartCard
          title="Project Status Distribution"
          subtitle="Overview of projects by their current status"
        >
          <div className="donut-chart-layout">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(${donutGradient})`,
              }}
            >
              <div className="donut-chart-inner">
                <strong>{totalProjects}</strong>
                <span>Total Projects</span>
              </div>
            </div>

            <div className="chart-legend">
              {projectStatuses.map((item) => (
                <LegendItem
                  key={item.label}
                  color={item.color}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </ChartCard>

        {/* PROCUREMENT STATUS */}
        <ChartCard
          title="Procurement Status Analysis"
          subtitle="Track purchase requests and approval progress"
        >
          {procurementStatuses.map((item) => (
            <Bar
              key={item.label}
              label={item.label}
              amount={item.value}
              max={maxProcurementStatus}
              color={item.color}
              displayValue={item.value}
            />
          ))}

          <div className="chart-total-row">
            <span>Total Procurement Requests</span>
            <strong>{procurements.length}</strong>
          </div>
        </ChartCard>

        {/* PORTFOLIO BUDGET */}
        <ChartCard
          title="Portfolio Budget Utilization"
          subtitle="Financial overview across all projects"
        >
          <div className="budget-summary-grid">
            <div className="budget-summary-item">
              <span>Total Budget</span>
              <strong>{formatCurrency(totalBudget)}</strong>
            </div>

            <div className="budget-summary-item">
              <span>Actual Spent</span>
              <strong className="spent-value">
                {formatCurrency(actualSpent)}
              </strong>
            </div>

            <div className="budget-summary-item">
              <span>Committed</span>
              <strong className="committed-value">
                {formatCurrency(committedAmount)}
              </strong>
            </div>

            <div className="budget-summary-item">
              <span>Remaining</span>
              <strong className="remaining-value">
                {formatCurrency(remainingBudget)}
              </strong>
            </div>
          </div>

          <div className="budget-utilization-heading">
            <span>Actual budget utilization</span>
            <strong>
              {totalBudget > 0
                ? ((actualSpent / totalBudget) * 100).toFixed(1)
                : '0.0'}%
            </strong>
          </div>

          <div className="chart-bar-track budget-utilization-track">
            <div
              className="chart-bar-fill"
              style={{
                width: `${totalBudget > 0
                  ? Math.min((actualSpent / totalBudget) * 100, 100)
                  : 0}%`,
                background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
              }}
            />
          </div>
        </ChartCard>

        {/* PROJECT BUDGET COMPARISON */}
        <ChartCard
          title="Project Budget Comparison"
          subtitle="Compare allocated budgets and actual spending"
        >
          {projects.length === 0 ? (
            <p className="chart-empty-state">
              No project records available yet.
            </p>
          ) : (
            projects.map((project) => {
              const summary = summaries.find(
                (item) => Number(item.projectId) === Number(project.id)
              )

              const spent = Number(summary?.actualSpent || 0)
              const budget = Number(project.budget || 0)

              return (
                <div className="project-budget-item" key={project.id}>
                  <div className="project-budget-heading">
                    <strong>{project.projectName}</strong>
                    <span>{formatCurrency(budget)}</span>
                  </div>

                  <div className="project-budget-track">
                    <div
                      className="project-budget-spent"
                      style={{
                        width: `${budget > 0
                          ? Math.min((spent / budget) * 100, 100)
                          : 0}%`,
                      }}
                    />
                  </div>

                  <div className="project-budget-footer">
                    <span>Spent: {formatCurrency(spent)}</span>
                    <span>
                      {budget > 0
                        ? ((spent / budget) * 100).toFixed(1)
                        : '0.0'}% utilized
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </ChartCard>

      </div>
    </section>
  )
}

export default DashboardCharts
