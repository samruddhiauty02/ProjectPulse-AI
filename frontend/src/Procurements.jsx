
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8080/api/procurements'
const PROJECT_API_URL = 'http://localhost:8080/api/projects'

const emptyForm = {
  title: '',
  vendorName: '',
  amount: '',
  requestDate: '',
  status: 'PENDING',
  description: '',
  projectId: '',
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

function normalizeStatus(status) {
  return (status || '').trim().toUpperCase()
}

function Procurements() {
  const [procurements, setProcurements] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  async function fetchProcurements() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to retrieve procurement records.')
      }

      const data = await response.json()
      setProcurements(data)
    } catch (err) {
      console.error('Procurement API error:', err)

      setError(
        'Unable to connect to the backend. Check that Spring Boot is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch(PROJECT_API_URL)

      if (!response.ok) {
        throw new Error('Unable to retrieve projects.')
      }

      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error('Project API error:', err)
      setFormError('Unable to load projects. Please check the backend.')
    }
  }

  useEffect(() => {
    fetchProcurements()
    fetchProjects()
  }, [])

  function openCreateForm() {
    setEditingId(null)
    setFormData(emptyForm)
    setFormError('')
    setSuccessMessage('')
    setShowForm(true)
  }

  function openEditForm(procurement) {
    setEditingId(procurement.id)

    setFormData({
      title: procurement.title || '',
      vendorName: procurement.vendorName || '',
      amount: procurement.amount ?? '',
      requestDate: procurement.requestDate || '',
      status: procurement.status || 'PENDING',
      description: procurement.description || '',
      projectId: procurement.project?.id
        ? String(procurement.project.id)
        : '',
    })

    setFormError('')
    setSuccessMessage('')
    setShowForm(true)
  }

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

    if (Number(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.')
      return
    }

    try {
      setSaving(true)

      // The backend receives projectId as a request parameter.
      // If it is blank, an existing project association is preserved
      // during an update.
      const requestUrl = formData.projectId
        ? `${API_URL}${editingId ? `/${editingId}` : ''}?projectId=${encodeURIComponent(formData.projectId)}`
        : editingId
          ? `${API_URL}/${editingId}`
          : API_URL

      const { projectId, ...procurementData } = formData

      const response = await fetch(requestUrl, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...procurementData,
          amount: Number(formData.amount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const messages = errorData?.messages

        if (messages) {
          throw new Error(Object.values(messages).join(', '))
        }

        throw new Error(
          errorData?.message ||
          `Unable to ${editingId ? 'update' : 'create'} procurement.`
        )
      }

      const wasEditing = Boolean(editingId)

      setShowForm(false)
      setFormData(emptyForm)
      setEditingId(null)

      setSuccessMessage(
        wasEditing
          ? 'Procurement updated successfully!'
          : 'Procurement created successfully!'
      )

      await fetchProcurements()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this procurement record?'
    )

    if (!confirmed) return

    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)

        throw new Error(
          errorData?.message || 'Unable to delete procurement.'
        )
      }

      setSuccessMessage('Procurement deleted successfully!')
      await fetchProcurements()
    } catch (err) {
      setError(err.message)
    }
  }

  // SEARCH AND STATUS FILTERING

  const filteredProcurements = procurements.filter((item) => {
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      item.title?.toLowerCase().includes(search) ||
      item.vendorName?.toLowerCase().includes(search) ||
      item.project?.projectName?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'ALL' ||
      normalizeStatus(item.status) === statusFilter

    return matchesSearch && matchesStatus
  })

  // FINANCIAL CALCULATIONS

  const getAmountByStatus = (status) => {
    return procurements
      .filter((item) => normalizeStatus(item.status) === status)
      .reduce((total, item) => total + Number(item.amount || 0), 0)
  }

  const totalAmount = procurements.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  )

  const pendingAmount = getAmountByStatus('PENDING')
  const approvedAmount = getAmountByStatus('APPROVED')
  const paidAmount = getAmountByStatus('PAID')
  const rejectedAmount = getAmountByStatus('REJECTED')

  const committedAmount = approvedAmount + paidAmount

  const pendingCount = procurements.filter(
    (item) => normalizeStatus(item.status) === 'PENDING'
  ).length

  const approvedCount = procurements.filter(
    (item) => normalizeStatus(item.status) === 'APPROVED'
  ).length

  const paidCount = procurements.filter(
    (item) => normalizeStatus(item.status) === 'PAID'
  ).length

  const linkedCount = procurements.filter(
    (item) => item.project?.id != null
  ).length

  const unlinkedCount = procurements.length - linkedCount

  const currentProcurement = editingId
    ? procurements.find((item) => item.id === editingId)
    : null

  return (
    <>
      <section className="welcome">
        <div>
          <h1>Procurement Management</h1>
          <p>
            Manage vendor requests, procurement costs and approval status.
          </p>
        </div>

        <button className="primary-btn" onClick={openCreateForm}>
          + New Procurement
        </button>
      </section>

      {error && <p className="error-message">{error}</p>}

      {successMessage && (
        <p className="success-message">{successMessage}</p>
      )}

      {/* PROCUREMENT OVERVIEW */}

      <section className="stats-grid">

        <div className="stat-card">
          <p>Total Procurement Requests</p>
          <h2>{loading ? '...' : procurements.length}</h2>
          <span>All procurement records</span>
        </div>

        <div className="stat-card">
          <p>Total Requested Amount</p>
          <h2>{loading ? '...' : formatCurrency(totalAmount)}</h2>
          <span>Across all statuses</span>
        </div>

        <div className="stat-card">
          <p>Pending Amount</p>
          <h2>{loading ? '...' : formatCurrency(pendingAmount)}</h2>
          <span>{pendingCount} requests awaiting approval</span>
        </div>

        <div className="stat-card">
          <p>Approved Amount</p>
          <h2>{loading ? '...' : formatCurrency(approvedAmount)}</h2>
          <span>{approvedCount} approved requests</span>
        </div>

        <div className="stat-card">
          <p>Actual Paid Amount</p>
          <h2>{loading ? '...' : formatCurrency(paidAmount)}</h2>
          <span>{paidCount} completed payments</span>
        </div>

        <div className="stat-card">
          <p>Total Committed Amount</p>
          <h2>{loading ? '...' : formatCurrency(committedAmount)}</h2>
          <span>Approved + paid procurement</span>
        </div>

        <div className="stat-card">
          <p>Rejected Amount</p>
          <h2>{loading ? '...' : formatCurrency(rejectedAmount)}</h2>
          <span>Rejected procurement requests</span>
        </div>

        <div className="stat-card">
          <p>Project Linkage</p>
          <h2>{loading ? '...' : `${linkedCount} / ${procurements.length}`}</h2>
          <span>
            {linkedCount} linked · {unlinkedCount} unlinked
          </span>
        </div>

      </section>

      {/* PROCUREMENT RECORDS */}

      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Procurement Records</h2>
            <p>View and manage all procurement requests.</p>
          </div>

          <button
            className="secondary-btn"
            onClick={fetchProcurements}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="procurement-filters">

          <input
            type="text"
            placeholder="Search by title, vendor or project..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>

        </div>

        <div className="table-wrapper">

          <table>
            <thead>
              <tr>
                <th>TITLE</th>
                <th>VENDOR</th>
                <th>PROJECT</th>
                <th>AMOUNT</th>
                <th>REQUEST DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7">Loading procurement records...</td>
                </tr>
              ) : filteredProcurements.length > 0 ? (

                filteredProcurements.map((item) => (

                  <tr key={item.id}>

                    <td>
                      <strong>{item.title}</strong>
                    </td>

                    <td>{item.vendorName}</td>

                    <td>
                      {item.project?.projectName || (
                        <span className="muted">Not linked</span>
                      )}
                    </td>

                    <td>{formatCurrency(item.amount)}</td>

                    <td>{formatDate(item.requestDate)}</td>

                    <td>
                      <span className="status">
                        {item.status?.replaceAll('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div className="procurement-actions">

                        <button
                          className="secondary-btn"
                          onClick={() => openEditForm(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="7">
                    No procurement records found.
                  </td>
                </tr>

              )}

            </tbody>
          </table>

        </div>

      </section>

      <footer>
        © 2026 ProjectPulse AI. All rights reserved.
      </footer>

      {/* CREATE / EDIT PROCUREMENT MODAL */}

      {showForm && (

        <div className="modal-overlay">

          <div className="project-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingId
                    ? 'Edit Procurement'
                    : 'New Procurement Request'}
                </h2>

                <p>Enter the procurement details below.</p>
              </div>

              <button
                className="close-btn"
                type="button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>Procurement Title *</label>

              <input
                type="text"
                name="title"
                placeholder="Enter procurement title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength="150"
                required
              />

              <label>Vendor Name *</label>

              <input
                type="text"
                name="vendorName"
                placeholder="Enter vendor name"
                value={formData.vendorName}
                onChange={handleInputChange}
                maxLength="150"
                required
              />

              <label>Procurement Amount (₹) *</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />

              <label>Request Date *</label>

              <input
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleInputChange}
                required
              />

              <label>Procurement Status *</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* PROJECT SELECTION */}

              <label>Link to Project</label>

              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
              >
                <option value="">
                  {editingId && currentProcurement?.project?.id
                    ? 'Keep current project'
                    : 'No project (Unassigned)'}
                </option>

                {projects.map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.projectName}
                  </option>
                ))}
              </select>

              <small className="muted">
                Select the project this procurement request belongs to.
                {editingId && currentProcurement?.project?.id
                  ? ' Leave the selection unchanged to keep its current project.'
                  : ' You can leave this unassigned if it is a general expense.'}
              </small>

              <label>Description</label>

              <textarea
                name="description"
                placeholder="Enter procurement description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength="1000"
                rows="3"
              />

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
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Procurement'
                      : 'Create Procurement'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  )
}

export default Procurements
