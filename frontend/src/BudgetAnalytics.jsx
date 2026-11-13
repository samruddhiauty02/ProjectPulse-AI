
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/projects'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function BudgetAnalytics() {
  const [projects, setProjects] = useState([])
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to load projects.')
      }

      const projectData = await response.json()
      setProjects(projectData)

      const results = await Promise.all(
        projectData.map(async (project) => {
          const summaryResponse = await fetch(
            `${API_URL}/${project.id}/procurement-summary`
          )

          if (!summaryResponse.ok) {
            throw new Error(
              `Unable to load budget details for ${project.projectName}.`
            )
          }

          return summaryResponse.json()
        })
      )

      setSummaries(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  // PORTFOLIO FINANCIAL CALCULATIONS

  const totalBudget = summaries.reduce(
    (total, item) => total + Number(item.projectBudget || 0),
    0
  )

  const totalRequested = summaries.reduce(
    (total, item) =>
      total + Number(item.totalRequestedProcurementAmount || 0),
    0
  )

  const totalPending = summaries.reduce(
    (total, item) =>
      total + Number(item.pendingProcurementAmount || 0),
    0
  )

  const totalApproved = summaries.reduce(
    (total, item) =>
      total + Number(item.approvedProcurementAmount || 0),
    0
  )

  const totalPaid = summaries.reduce(
    (total, item) =>
      total + Number(item.paidProcurementAmount || 0),
    0
  )

  const totalRejected = summaries.reduce(
    (total, item) =>
      total + Number(item.rejectedProcurementAmount || 0),
    0
  )

  const totalCommitted = summaries.reduce(
    (total, item) => total + Number(item.committedAmount || 0),
    0
  )

  const remainingBudget = totalBudget - totalCommitted

  const actualUtilization = totalBudget > 0
    ? (totalPaid / totalBudget) * 100
    : 0

  const committedUtilization = totalBudget > 0
    ? (totalCommitted / totalBudget) * 100
    : 0

  const maximumSpending = Math.max(
    ...summaries.map((item) =>
      Number(item.paidProcurementAmount || 0)
    ),
    1
  )

  if (loading) {
    return (
      <div className="content-card">
        <p>Loading budget analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-card">
        <p className="error-message">{error}</p>
        <button className="secondary-btn" onClick={loadAnalytics}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="budget-analytics-page">

      <div className="projects-heading">
        <div>
          <h1>Budget Analytics</h1>
          <p>
            Monitor project budgets, procurement commitments and actual
            financial expenditure.
          </p>
        </div>

        <button className="secondary-btn" onClick={loadAnalytics}>
          Refresh Analytics
        </button>
      </div>

      {/* FINANCIAL SUMMARY */}

      <section className="stats-grid">

        <div className="stat-card">
          <p>Total Allocated Budget</p>
          <h2>{formatCurrency(totalBudget)}</h2>
          <span>Across all projects</span>
        </div>

        <div className="stat-card">
          <p>Actual Paid Expenses</p>
          <h2>{formatCurrency(totalPaid)}</h2>
          <span>Procurement payments completed</span>
        </div>

        <div className="stat-card">
          <p>Pending Requests</p>
          <h2>{formatCurrency(totalPending)}</h2>
          <span>Awaiting approval</span>
        </div>

        <div className="stat-card">
          <p>Approved Commitments</p>
          <h2>{formatCurrency(totalApproved)}</h2>
          <span>Approved but not yet paid</span>
        </div>

        <div className="stat-card">
          <p>Total Committed Budget</p>
          <h2>{formatCurrency(totalCommitted)}</h2>
          <span>Approved + paid</span>
        </div>

        <div className="stat-card">
          <p>Remaining Available Budget</p>
          <h2>{formatCurrency(remainingBudget)}</h2>
          <span>Budget minus commitments</span>
        </div>

      </section>

      {/* PORTFOLIO UTILIZATION */}

      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Portfolio Budget Utilization</h2>
            <p>Actual spending and committed funds against allocated budget</p>
          </div>
        </div>

        <div className="budget-progress-info">
          <strong>
            Actual Spending: {actualUtilization.toFixed(2)}%
          </strong>
          <strong>{formatCurrency(totalBudget)}</strong>
        </div>

        <div className="budget-progress-track">
          <div
            className="budget-progress-fill"
            style={{
              width: `${Math.min(Math.max(actualUtilization, 0), 100)}%`,
              background: actualUtilization > 100 ? '#dc2626' : '#2563eb',
            }}
          />
        </div>

        <p className="muted">
          {formatCurrency(totalPaid)} actually paid out of{' '}
          {formatCurrency(totalBudget)} allocated.
        </p>

        <div className="budget-progress-info">
          <strong>
            Committed Budget: {committedUtilization.toFixed(2)}%
          </strong>
          <strong>{formatCurrency(totalCommitted)}</strong>
        </div>

        <div className="budget-progress-track">
          <div
            className="budget-progress-fill"
            style={{
              width: `${Math.min(Math.max(committedUtilization, 0), 100)}%`,
              background: committedUtilization > 100 ? '#dc2626' : '#16a34a',
            }}
          />
        </div>

        <p className="muted">
          Approved and paid procurement: {formatCurrency(totalCommitted)}.
        </p>

        {committedUtilization > 100 && (
          <p className="error-message">
            Portfolio commitments have exceeded the allocated budget.
          </p>
        )}

      </section>

      {/* PROCUREMENT STATUS BREAKDOWN */}

      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Procurement Status Breakdown</h2>
            <p>Financial distribution of all recorded procurement requests</p>
          </div>
        </div>

        <div className="spending-chart">

          {[
            { label: 'Pending', amount: totalPending },
            { label: 'Approved', amount: totalApproved },
            { label: 'Paid', amount: totalPaid },
            { label: 'Rejected', amount: totalRejected },
          ].map((item) => (
            <div className="spending-row" key={item.label}>

              <div className="spending-label">
                <strong>{item.label}</strong>
                <span>{formatCurrency(item.amount)}</span>
              </div>

              <div className="spending-track">
                <div
                  className="spending-fill"
                  style={{
                    width: `${totalRequested > 0
                      ? (item.amount / totalRequested) * 100
                      : 0}%`,
                  }}
                />
              </div>

              <div className="spending-details">
                <span>
                  {totalRequested > 0
                    ? `${((item.amount / totalRequested) * 100).toFixed(2)}% of requests`
                    : '0.00% of requests'}
                </span>
              </div>

            </div>
          ))}

        </div>

        <p className="muted">
          Total recorded procurement requests: {formatCurrency(totalRequested)}
        </p>

      </section>

      {/* PROJECT-WISE ACTUAL SPENDING */}

      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Project-wise Actual Spending</h2>
            <p>Compare completed procurement payments across projects</p>
          </div>
        </div>

        {summaries.length > 0 ? (

          <div className="spending-chart">

            {summaries.map((item) => {
              const spent = Number(item.actualSpentAmount || 0)

              const percentage = Number(
                item.actualSpendUtilizationPercentage || 0
              )

              return (
                <div className="spending-row" key={item.projectId}>

                  <div className="spending-label">
                    <strong>{item.projectName}</strong>
                    <span>{formatCurrency(spent)}</span>
                  </div>

                  <div className="spending-track">
                    <div
                      className="spending-fill"
                      style={{
                        width: `${(spent / maximumSpending) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="spending-details">
                    <span>
                      Budget: {formatCurrency(item.projectBudget)}
                    </span>
                    <span>
                      Actual utilization: {percentage.toFixed(2)}%
                    </span>
                  </div>

                </div>
              )
            })}

          </div>

        ) : (
          <p>No project spending information available.</p>
        )}

      </section>

      {/* PROJECT BUDGET TABLE */}

      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Project Budget Breakdown</h2>
            <p>Detailed financial position of each project</p>
          </div>
        </div>

        <div className="table-wrapper">

          <table>
            <thead>
              <tr>
                <th>PROJECT NAME</th>
                <th>ALLOCATED BUDGET</th>
                <th>PENDING</th>
                <th>APPROVED</th>
                <th>ACTUAL PAID</th>
                <th>COMMITTED</th>
                <th>REMAINING BUDGET</th>
                <th>COMMITTED UTILIZATION</th>
                <th>BUDGET STATUS</th>
              </tr>
            </thead>

            <tbody>
              {summaries.length > 0 ? (
                summaries.map((item) => {
                  const percentage = Number(
                    item.committedBudgetUtilizationPercentage || 0
                  )

                  const exceeded = Number(item.remainingBudget) < 0

                  return (
                    <tr key={item.projectId}>
                      <td><strong>{item.projectName}</strong></td>

                      <td>{formatCurrency(item.projectBudget)}</td>

                      <td>
                        {formatCurrency(item.pendingProcurementAmount)}
                      </td>

                      <td>
                        {formatCurrency(item.approvedProcurementAmount)}
                      </td>

                      <td>
                        {formatCurrency(item.paidProcurementAmount)}
                      </td>

                      <td>{formatCurrency(item.committedAmount)}</td>

                      <td>{formatCurrency(item.remainingBudget)}</td>

                      <td>{percentage.toFixed(2)}%</td>

                      <td>
                        <span className="status">
                          {exceeded ? 'OVER BUDGET' : 'WITHIN BUDGET'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9">No project data available.</td>
                </tr>
              )}
            </tbody>
          </table>

        </div>

      </section>

      <p className="muted">
        Financial calculations use linked procurement records.
        Pending requests are excluded from committed budget and actual spending.
        Actual spending includes PAID records only.
      </p>

    </div>
  )
}

export default BudgetAnalytics
