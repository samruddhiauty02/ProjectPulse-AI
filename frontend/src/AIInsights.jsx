
import { useState } from 'react'
import './AIInsights.css'

const AI_API_URL = 'http://localhost:8080/api/ai/ask'

function AIInsights() {
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')

  async function generateInsights() {
    setLoading(true)
    setError('')
    setInsights('')
    setGeneratedAt('')

    const question = `
      Act as a senior enterprise project management and financial analyst.

      Analyze the latest project, budget, deadline, and procurement
      information available in the connected database.

      Generate a management report with these sections:

      1. PROJECT PORTFOLIO HEALTH
      Summarize the current project portfolio and identify projects
      that need management attention.

      2. FINANCIAL INSIGHTS
      Analyze project budgets, procurement commitments, actual paid
      expenses, remaining budgets, and budget utilization.

      3. PROCUREMENT RISKS
      Identify pending procurement requests, unusually large requests,
      and procurement items that may require approval or follow-up.

      4. DEADLINE RISKS
      Identify overdue projects and projects approaching their deadlines.
      Consider the current date when evaluating deadlines.

      5. RECOMMENDED MANAGEMENT ACTIONS
      Give 3 to 5 practical, prioritized actions that management
      should consider.

      IMPORTANT:
      - Base database-specific statements only on actual database records.
      - Do not invent project names, amounts, dates, or statuses.
      - Distinguish pending requests, approved commitments, and
        actual paid expenses.
      - Do not treat pending requests as money already spent.
      - Clearly mention when information is unavailable.
      - Keep the report professional, concise, and easy to understand.
      - Use clear headings and bullet points.
    `

    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to generate business insights.'
        )
      }

      if (!data.answer) {
        throw new Error('The AI returned an empty response.')
      }

      setInsights(data.answer)
      setGeneratedAt(
        new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      )

    } catch (err) {
      console.error('AI Insights error:', err)

      setError(
        err.message ||
        'Unable to connect to the AI service. Please try again.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ai-insights-section">

      <div className="ai-insights-header">

        <div className="ai-insights-title">

          <div className="ai-insights-icon">
            ✦
          </div>

          <div>
            <h2>AI Business Insights</h2>

            <p>
              Intelligent analysis and recommendations powered by Gemini AI.
            </p>
          </div>

        </div>

        <button
          className="generate-insights-btn"
          onClick={generateInsights}
          disabled={loading}
        >
          {loading ? 'Analyzing Data...' : '✦ Generate AI Insights'}
        </button>

      </div>

      {!insights && !loading && !error && (

        <div className="ai-insights-empty">

          <div className="ai-insights-empty-icon">
            ✧
          </div>

          <h3>Discover What Your Data Is Telling You</h3>

          <p>
            Generate an AI-powered report to uncover financial risks,
            project delays, procurement concerns, and recommended actions.
          </p>

          <span>
            Analysis uses the latest available database information.
          </span>

        </div>

      )}

      {loading && (

        <div className="ai-insights-loading">

          <div className="ai-loading-spinner"></div>

          <h3>Analyzing Your Business Data</h3>

          <p>
            Gemini AI is reviewing your projects, budgets,
            procurement requests, and deadlines.
          </p>

          <span>Please wait while your report is generated...</span>

        </div>

      )}

      {error && (

        <div className="ai-insights-error">
          <strong>Unable to Generate Insights</strong>
          <p>{error}</p>

          <button
            className="retry-insights-btn"
            onClick={generateInsights}
          >
            Try Again
          </button>
        </div>

      )}

      {insights && (

        <div className="ai-insights-result">

          <div className="ai-insights-result-header">

            <div>
              <h3>Management Intelligence Report</h3>
              <span>Generated by Gemini AI</span>
            </div>

            <span className="ai-report-status">
              Analysis Complete
            </span>

          </div>

          <div className="ai-insights-answer">
            {insights}
          </div>

          <div className="ai-insights-footer">

            <span>
              Generated on: {generatedAt}
            </span>

            <button
              className="regenerate-insights-btn"
              onClick={generateInsights}
              disabled={loading}
            >
              ↻ Regenerate Report
            </button>

          </div>

        </div>

      )}

    </section>
  )
}

export default AIInsights
