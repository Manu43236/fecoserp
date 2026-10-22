import { useRef, useState, useCallback } from 'react'
import {
  Upload, Download, X, FileText, CloudUpload, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export interface BulkResult {
  created: number
  errors: Array<{ row: number; message: string }>
}

interface Props {
  label?: string
  templateHeaders: string[]
  templateFilename: string
  templateSampleRow: string[]
  notes: string[]
  onUpload: (file: File) => Promise<{ data: { data: BulkResult } }>
  onSuccess: () => void
  disabled?: boolean
}

export function BulkUploadButton({
  label = 'Bulk Upload',
  templateHeaders,
  templateFilename,
  templateSampleRow,
  notes,
  onUpload,
  onSuccess,
  disabled,
}: Props) {
  const [open, setOpen]       = useState(false)
  const [file, setFile]       = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const rows = [templateHeaders.join(','), templateSampleRow.join(',')]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = templateFilename; a.click()
    URL.revokeObjectURL(url)
  }

  const pickFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Only CSV files are accepted'); return }
    setFile(f)
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  async function handleSave() {
    if (!file) return
    setLoading(true)
    try {
      const res    = await onUpload(file)
      const result = res.data.data
      if (result.errors.length === 0) {
        toast.success(`Imported ${result.created} record${result.created !== 1 ? 's' : ''}`)
      } else {
        toast.custom(() => (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-gray-900">
                Imported {result.created} · {result.errors.length} failed
              </p>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {result.errors.map(err => (
                <div key={err.row} className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Row {err.row}:</span> {err.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ), { duration: 7000 })
      }
      onSuccess()
      setFile(null)
      setOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function closeDrawer() {
    if (loading) return
    setOpen(false)
    setFile(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        <Upload size={14} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop — no close on click per project rule */}
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative bg-white w-full md:w-[440px] h-full shadow-2xl flex flex-col">

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <CloudUpload size={14} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Download template */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Download Template</p>
                  <p className="text-xs text-gray-500 mt-0.5">{templateFilename}</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>

              {/* How to use */}
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">How to use</p>
                <ol className="space-y-1.5">
                  {notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs text-blue-700 leading-relaxed">{note}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Drag & drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-10 ${
                  dragging
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {file ? (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <FileText size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · Click to replace
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <CloudUpload size={20} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {dragging ? 'Drop your file here' : 'Drag & drop your CSV'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                    </div>
                    <span className="text-xs text-gray-400 px-2 py-1 rounded-md bg-gray-100">
                      .csv only
                    </span>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }}
                />
              </div>

            </div>

            {/* Sticky footer */}
            <div
              className="px-5 py-4 flex gap-3 shrink-0"
              style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
            >
              <button
                type="button"
                onClick={closeDrawer}
                disabled={loading}
                className="flex-1 h-10 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!file || loading}
                className="flex-1 h-10 text-sm font-semibold text-white rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Uploading…' : 'Save'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
