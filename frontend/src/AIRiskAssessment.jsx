
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/projects'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function getRiskLevel(score) {
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

function calculateRisk(project, summary) {
  let deadlineRisk = 0
  let budgetRisk = 0
  let procurementRisk = 0

  const reasons = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Deadline risk (maximum 40 points)
  if (project.status?.toUpperCase() === 'COMPLETED') {
    deadlineRisk = 0
  } else if (project.endDate) {
    const deadline = new Date(`${project.endDate}T00:00:00`)
    const daysRemaining = Math.ceil(
      (deadline - today) / (1000 * 60 * 60 * 24)
    )

    if (daysRemaining < 0) {
      deadlineRisk = 40
      reasons.push(`Project is ${Math.abs(daysRemaining)} days overdue.`)
    } else if (daysRemaining <= 7) {
      deadlineRisk = 30
      reasons.push('Deadline is within the next 7 days.')
    } else if (daysRemaining <= 30) {
      deadlineRisk = 20
      reasons.push('Deadline is approaching within 30 days.')
    } else if (daysRemaining <= 60) {
      deadlineRisk = 10
      reasons.push('Deadline is approaching within 60 days.')
    }
  }

  // 2. Budget risk (maximum 40 points)
  const budget = Number(project.budget) || 0
  const committedPercentage = Number(
    summary?.committedBudgetUtilizationPercentage
  ) || 0

  if (budget > 0) {
    if (committedPercentage >= 100) {
      budgetRisk = 40
      reasons.push('Committed procurement has reached or exceeded the project budget.')
    } else if (committedPercentage >= 85) {
      budgetRisk = 30
      reasons.push('At least 85% of the project budget is committed.')
    } else if (committedPercentage >= 70) {
      budgetRisk = 20
      reasons.push('A significant portion of the project budget is committed.')
    } else if (committedPercentage >= 50) {
      budgetRisk = 10
      reasons.push('More than half of the project budget is committed.')
    }
  } else {
    reasons.push('Budget information is missing or zero; budget risk could not be assessed.')
  }

  // 3. Pending procurement risk (maximum 20 points)
  const pendingAmount = Number(
    summary?.pendingProcurementAmount
  ) || 0

  const pendingPercentage = budget > 0
    ? (pendingAmount / budget) * 100
    : 0

  if (pendingPercentage >= 30) {
    procurementRisk = 20
    reasons.push('Pending procurement requests represent at least 30% of the project budget.')
  } else if (pendingPercentage >= 15) {
    procurementRisk = 15
    reasons.push('Pending procurement requests represent a significant budget amount.')
  } else if (pendingPercentage >= 5) {
    procurementRisk = 10
    reasons.push('Pending procurement requests require monitoring.')
  } else if (pendingAmount > 0) {
    procurementRisk = 5
    reasons.push('There are pending procurement requests awaiting a decision.')
  }

  const score = Math.min(
    100,
    deadlineRisk + budgetRisk + procurementRisk
  )

  if (reasons.length === 0) {
    reasons.push('No major risk indicators were identified by the current scoring rules.')
  }

  return {
    score,
    level: getRiskLevel(score),
    deadlineRisk,
    budgetRisk,
    procurementRisk,
    committedPercentage,
    pendingAmount,
    reasons,
  }
}

export default function AIRiskAssessment() {
  const [riskData, setRiskData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadRiskAssessment() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to fetch projects from the backend.')
      }

      const projects = await response.json()

      const assessments = await Promise.all(
        projects.map(async (project) => {
          try {
            const summaryResponse = await fetch(
              `${API_URL}/${project.id}/procurement-summary`
            )

            if (!summaryResponse.ok) {
              throw new Error('Unable to fetch procurement summary.')
            }

            const summary = await summaryResponse.json()

            return {
              ...project,
              summary,
              risk: calculateRisk(project, summary),
            }
          } catch {
            return {
              ...project,
              summary: null,
              risk: calculateRisk(project, null),
              summaryUnavailable: true,
            }
          }
        })
      )

      assessments.sort((a, b) => b.risk.score - a.risk.score)

      setRiskData(assessments)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRiskAssessment()
  }, [])

  const highRisk = riskData.filter(
    item => item.risk.level === 'HIGH'
  ).length

  const mediumRisk = riskData.filter(
    item => item.risk.level === 'MEDIUM'
  ).length

  const lowRisk = riskData.filter(
    item => item.risk.level === 'LOW'
  ).length

  const styles = {
    container: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 4px 18px rgba(20, 35, 70, 0.06)',
      border: '1px solid #e8edf5',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
    },
    title: {
      fontSize: '21px',
      fontWeight: 750,
      color: '#20283a',
      margin: 0,
    },
    subtitle: {
      color: '#7b8498',
      fontSize: '13px',
      marginTop: '6px',
    },
    button: {
      padding: '10px 16px',
      border: 'none',
      borderRadius: '8px',
      background: '#4f46e5',
      color: '#ffffff',
      fontWeight: 600,
      cursor: 'pointer',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '12px',
      marginBottom: '22px',
    },
    summaryCard: {
      padding: '16px',
      borderRadius: '12px',
      background: '#f7f8fc',
      border: '1px solid #edf0f6',
    },
    summaryNumber: {
      fontSize: '27px',
      fontWeight: 750,
      margin: '5px 0',
    },
    card: {
      border: '1px solid #e8edf5',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px',
      background: '#ffffff',
    },
    cardTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '14px',
    },
    projectName: {
      color: '#20283a',
      fontSize: '16px',
      fontWeight: 700,
      margin: 0,
    },
    riskBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 750,
    },
    score: {
      fontSize: '25px',
      fontWeight: 800,
    },
    barBackground: {
      width: '100%',
      height: '9px',
      background: '#edf0f5',
      borderRadius: '20px',
      overflow: 'hidden',
      margin: '10px 0 16px',
    },
    factorGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '12px',
      marginBottom: '14px',
    },
    factor: {
      background: '#f7f8fc',
      borderRadius: '8px',
      padding: '11px',
    },
    reason: {
      color: '#586174',
      fontSize: '13px',
      margin: '7px 0',
      lineHeight: 1.5,
    },
    muted: {
      color: '#7b8498',
      fontSize: '12px',
    },
  }

  const colors = {
    HIGH: { text: '#dc2626', background: '#fee2e2' },
    MEDIUM: { text: '#b7791f', background: '#fef3c7' },
    LOW: { text: '#15803d', background: '#dcfce7' },
  }

  return (
    <section style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Project Risk Assessment</h2>
          <p style={styles.subtitle}>
            Rule-based risk evaluation using live project and procurement data
          </p>
        </div>

        <button
          style={styles.button}
          onClick={loadRiskAssessment}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : '↻ Refresh Assessment'}
        </button>
      </div>

      {loading && (
        <p style={styles.muted}>Analyzing your project portfolio...</p>
      )}

      {error && (
        <p style={{ color: '#dc2626', fontSize: '14px' }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <span style={styles.muted}>Total Projects</span>
              <div style={styles.summaryNumber}>{riskData.length}</div>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.muted}>High Risk</span>
              <div style={{ ...styles.summaryNumber, color: '#dc2626' }}>
                {highRisk}
              </div>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.muted}>Medium Risk</span>
              <div style={{ ...styles.summaryNumber, color: '#b7791f' }}>
                {mediumRisk}
              </div>
            </div>

            <div style={styles.summaryCard}>
              <span style={styles.muted}>Low Risk</span>
              <div style={{ ...styles.summaryNumber, color: '#15803d' }}>
                {lowRisk}
              </div>
            </div>
          </div>

          {riskData.length === 0 && (
            <p style={styles.muted}>
              No projects found. Add a project to generate a risk assessment.
            </p>
          )}

          {riskData.map(project => {
            const risk = project.risk
            const color = colors[risk.level]

            return (
              <div key={project.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.projectName}>
                      {project.projectName}
                    </h3>
                    <p style={styles.muted}>
                      Project ID: {project.id} · Status: {project.status}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...styles.riskBadge,
                      color: color.text,
                      background: color.background,
                    }}>
                      {risk.level} RISK
                    </div>

                    <div style={{
                      ...styles.score,
                      color: color.text,
                      marginTop: '5px',
                    }}>
                      {risk.score}/100
                    </div>
                  </div>
                </div>

                <div style={styles.barBackground}>
                  <div style={{
                    width: `${risk.score}%`,
                    height: '100%',
                    background: color.text,
                    borderRadius: '20px',
                  }} />
                </div>

                <div style={styles.factorGrid}>
                  <div style={styles.factor}>
                    <span style={styles.muted}>Deadline Risk</span>
                    <div style={{ fontWeight: 700 }}>
                      {risk.deadlineRisk}/40
                    </div>
                  </div>

                  <div style={styles.factor}>
                    <span style={styles.muted}>Budget Risk</span>
                    <div style={{ fontWeight: 700 }}>
                      {risk.budgetRisk}/40
                    </div>
                  </div>

                  <div style={styles.factor}>
                    <span style={styles.muted}>Procurement Risk</span>
                    <div style={{ fontWeight: 700 }}>
                      {risk.procurementRisk}/20
                    </div>
                  </div>

                  <div style={styles.factor}>
                    <span style={styles.muted}>Committed Budget</span>
                    <div style={{ fontWeight: 700 }}>
                      {risk.committedPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {project.summaryUnavailable && (
                  <p style={{ ...styles.reason, color: '#b7791f' }}>
                    Procurement summary unavailable. Some risk factors may be incomplete.
                  </p>
                )}

                <p style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#20283a',
                  marginBottom: '8px',
                }}>
                  Risk Indicators
                </p>

                {risk.reasons.map((reason, index) => (
                  <p key={index} style={styles.reason}>
                    • {reason}
                  </p>
                ))}

                <p style={{ ...styles.muted, marginTop: '12px' }}>
                  Pending procurement: {formatCurrency(risk.pendingAmount)}
                </p>
              </div>
            )
          })}

          <p style={{
            ...styles.muted,
            marginTop: '18px',
            lineHeight: 1.6,
          }}>
            Risk scores are rule-based estimates, not guarantees. The scoring
            model evaluates deadline risk (40 points), committed budget risk
            (40 points), and pending procurement risk (20 points).
            Low: 0–39 · Medium: 40–69 · High: 70–100.
          </p>
        </>
      )}
    </section>
  )
}
