import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage, isNotFoundError } from '../../api/error.js'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table.jsx'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PatientReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState({ name: '', notes: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const fileRef = useRef(null)

  // View modal
  const [viewReport, setViewReport] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await patientApi.getMyReports()
      const list = res?.data ?? res?.reports ?? res ?? []
      setReports(Array.isArray(list) ? list : [])
    } catch (err) {
      if (!isNotFoundError(err)) toast.error(getApiErrorMessage(err))
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openUpload() {
    setForm({ name: '', notes: '' })
    setFile(null)
    setFormErrors({})
    setUploadOpen(true)
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      toast.error('File is too large. Maximum 4 MB allowed.')
      return
    }
    setFile(f)
    if (!form.name) setForm((p) => ({ ...p, name: f.name }))
  }

  async function handleUpload(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Report name is required'
    if (!file) errs.file = 'Please choose a file'
    setFormErrors(errs)
    if (Object.keys(errs).length) return

    setUploading(true)
    try {
      const fileData = await readFileAsBase64(file)
      await patientApi.uploadReport({
        name: form.name.trim(),
        notes: form.notes.trim(),
        fileType: file.type,
        fileSize: file.size,
        fileData,
      })
      toast.success('Report uploaded')
      setUploadOpen(false)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleView(reportId) {
    setViewLoading(true)
    try {
      const res = await patientApi.getReport(reportId)
      setViewReport(res?.data ?? res)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setViewLoading(false)
    }
  }

  async function handleDelete(reportId) {
    if (!window.confirm('Delete this report?')) return
    try {
      await patientApi.deleteReport(reportId)
      toast.success('Report deleted')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (loading) return <LoadingScreen title="Loading reports…" />

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">My medical reports</div>
              <div className="text-xs text-slate-500">
                Upload and manage your lab results, scans, and documents (max 4 MB each).
              </div>
            </div>
            <Button onClick={openUpload} id="upload-report-btn">
              + Upload report
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {reports.length === 0 ? (
            <EmptyState
              title="No reports uploaded yet"
              description="Upload your lab results, scans, or any medical documents here."
              actionLabel="Upload first report"
              onAction={openUpload}
            />
          ) : (
            <Table>
              <THead>
                <TH>Report name</TH>
                <TH>File type</TH>
                <TH>Size</TH>
                <TH>Uploaded</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {reports.map((r) => (
                  <TR key={r._id ?? r.id}>
                    <TD className="font-medium text-slate-900">{r.name}</TD>
                    <TD className="text-xs text-slate-500">{r.fileType || '—'}</TD>
                    <TD>{formatBytes(r.fileSize)}</TD>
                    <TD>{r.createdAt ? String(r.createdAt).slice(0, 10) : '—'}</TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={viewLoading}
                          onClick={() => handleView(r._id ?? r.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(r._id ?? r.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        title="Upload medical report"
        onClose={() => setUploadOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button form="upload-report-form" type="submit" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        }
      >
        <form id="upload-report-form" onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Report name"
            name="name"
            placeholder="e.g., Blood Test Results – Apr 2025"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={formErrors.name}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              File <span className="text-slate-400">(PDF, image, etc. — max 4 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
            />
            {formErrors.file ? (
              <p className="mt-1 text-sm text-rose-600">{formErrors.file}</p>
            ) : null}
          </div>
          <Input
            label="Notes (optional)"
            name="notes"
            placeholder="Any context about this report…"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={Boolean(viewReport)}
        title={viewReport?.name ?? 'Report'}
        onClose={() => setViewReport(null)}
        footer={
          viewReport?.fileData ? (
            <div className="flex justify-end">
              <a
                href={viewReport.fileData}
                download={viewReport.name}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
              >
                ⬇ Download
              </a>
            </div>
          ) : null
        }
      >
        {viewReport ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-500">File type</div>
                <div className="mt-0.5 text-sm font-medium text-slate-900">{viewReport.fileType || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-500">Size</div>
                <div className="mt-0.5 text-sm font-medium text-slate-900">{formatBytes(viewReport.fileSize)}</div>
              </div>
            </div>
            {viewReport.notes ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-500">Notes</div>
                <div className="mt-0.5 text-sm text-slate-700">{viewReport.notes}</div>
              </div>
            ) : null}
            {viewReport.fileData ? (
              viewReport.fileType?.startsWith('image/') ? (
                <img
                  src={viewReport.fileData}
                  alt={viewReport.name}
                  className="max-h-80 w-full rounded-xl object-contain"
                />
              ) : viewReport.fileType === 'application/pdf' ? (
                <iframe
                  src={viewReport.fileData}
                  title={viewReport.name}
                  className="h-80 w-full rounded-xl border border-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-600">Preview not available for this file type. Use the Download button.</p>
              )
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  )
}
