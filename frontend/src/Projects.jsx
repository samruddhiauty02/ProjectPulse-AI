
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/projects'

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
  }).format(Number(amount) || 0)
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

function Projects() {
  const [projects, setProjects] = useState([])
  const [procurementSummaries, setProcurementSummaries] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showEditForm, setShowEditForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadProjects() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to load projects.')
      }

      const data = await response.json()
      setProjects(data)

      const summaryResults = await Promise.all(
        data.map(async (project) => {
          try {
            const summaryResponse = await fetch(
              `${API_URL}/${project.id}/procurement-summary`
            )

            if (!summaryResponse.ok) {
              return [project.id, null]
            }

            const summary = await summaryResponse.json()
            return [project.id, summary]
          } catch {
            return [project.id, null]
          }
        })
      )

      setProcurementSummaries(Object.fromEntries(summaryResults))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.projectName
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  function openEditForm(project) {
    setEditingId(project.id)

    setFormData({
      projectName: project.projectName || '',
      description: project.description || '',
      budget: project.budget ?? '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status || 'PLANNED',
    })

    setFormError('')
    setShowEditForm(true)
  }

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleUpdate(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be earlier than start date.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
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

        throw new Error(errorData?.message || 'Unable to update project.')
      }

      setShowEditForm(false)
      setSuccess('Project updated successfully!')

      await loadProjects()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.projectName}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`${API_URL}/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Unable to delete project.')
      }

      setSuccess('Project deleted successfully!')
      await loadProjects()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="projects-page">

      <div className="projects-heading">
        <div>
          <h1>Project Management</h1>
          <p>View, search and manage projects with procurement insights.</p>
        </div>

        <button className="secondary-btn" onClick={loadProjects}>
          Refresh Projects
        </button>
      </div>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="project-filters">
        <input
          type="text"
          placeholder="Search projects by name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="content-card">
        <div className="section-heading">
          <div>
            <h2>All Projects</h2>
            <p>{filteredProjects.length} project(s) found</p>
          </div>
        </div>

        {loading ? (
          <p>Loading projects and procurement analytics...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>PROJECT NAME</th>
                  <th>PROJECT BUDGET</th>
                  <th>ACTUAL PAID EXPENSES</th>
                  <th>PENDING REQUESTS</th>
                  <th>COMMITTED AMOUNT</th>
                  <th>REMAINING BUDGET</th>
                  <th>BUDGET UTILIZATION</th>
                  <th>DEADLINE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const summary = procurementSummaries[project.id]
                    const budget = Number(project.budget) || 0

                    const actualSpent = Number(
                      summary?.actualSpentAmount ?? 0
                    )

                    const pending = Number(
                      summary?.pendingProcurementAmount ?? 0
                    )

                    const committed = Number(
                      summary?.committedAmount ?? 0
                    )

                    const remaining = Number(
                      summary?.remainingBudget ?? budget
                    )

                    const utilization = Number(
                      summary?.committedBudgetUtilizationPercentage ?? 0
                    )

                    const progressWidth = Math.min(
                      Math.max(utilization, 0),
                      100
                    )

                    return (
                      <tr key={project.id}>
                        <td>
                          <strong>{project.projectName}</strong>
                        </td>

                        <td>{formatCurrency(budget)}</td>

                        <td>
                          {summary
                            ? formatCurrency(actualSpent)
                            : 'Unavailable'}
                        </td>

                        <td>
                          {summary
                            ? formatCurrency(pending)
                            : 'Unavailable'}
                        </td>

                        <td>
                          {summary
                            ? formatCurrency(committed)
                            : 'Unavailable'}
                        </td>

                        <td>
                          {summary
                            ? formatCurrency(remaining)
                            : 'Unavailable'}
                        </td>

                        <td style={{ minWidth: '160px' }}>
                          {summary ? (
                            <div>
                              <strong>{utilization.toFixed(2)}%</strong>

                              <div
                                style={{
                                  width: '100%',
                                  height: '8px',
                                  background: '#e5e7eb',
                                  borderRadius: '10px',
                                  marginTop: '7px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progressWidth}%`,
                                    height: '100%',
                                    background:
                                      utilization > 100
                                        ? '#dc2626'
                                        : '#2563eb',
                                    borderRadius: '10px',
                                  }}
                                />
                              </div>

                              {utilization > 100 && (
                                <small style={{ color: '#dc2626' }}>
                                  Budget exceeded
                                </small>
                              )}
                            </div>
                          ) : (
                            'Unavailable'
                          )}
                        </td>

                        <td>{formatDate(project.endDate)}</td>

                        <td>
                          <span className="status">
                            {project.status.replaceAll('_', ' ')}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => openEditForm(project)}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(project)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="10">No matching projects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditForm && (
        <div className="modal-overlay">
          <div className="project-modal">

            <div className="modal-header">
              <div>
                <h2>Edit Project</h2>
                <p>Update your project information.</p>
              </div>

              <button
                className="close-btn"
                type="button"
                onClick={() => setShowEditForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate}>

              <label>Project Name *</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                maxLength="150"
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength="1000"
                rows="3"
              />

              <label>Project Budget (₹) *</label>
              <input
                type="number"
                name="budget"
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
                  onClick={() => setShowEditForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Projects
