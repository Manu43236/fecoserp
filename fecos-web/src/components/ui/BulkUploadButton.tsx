import { useRef, useState } from 'react'
import { Upload, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export interface BulkResult {
  created: number
  errors: Array<{ row: number; message: string }>
}

interface Props {
  templateHeaders: string[]
  templateFilename: string
  templateSampleRow: string[]
  onUpload: (file: File) => Promise<{ data: { data: BulkResult } }>
  onSuccess: () => void
  disabled?: boolean
}

export function BulkUploadButton({
  templateHeaders,
  templateFilename,
  templateSampleRow,
  onUpload,
  onSuccess,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  function downloadTemplate() {
    const rows = [templateHeaders.join(','), templateSampleRow.join(',')]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = templateFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setLoading(true)
    try {
      const res    = await onUpload(file)
      const result = res.data.data
      if (result.errors.length === 0) {
        toast.success(`Imported ${result.created} record${result.created !== 1 ? 's' : ''}`)
      } else {
        toast.custom(() => (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-gray-900">
                Imported {result.created} · {result.errors.length} failed
              </p>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {result.errors.map(err => (
                <div key={err.row} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Row {err.row}:</span> {err.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ), { duration: 6000 })
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={downloadTemplate}
        disabled={disabled}
        title="Download CSV template"
        className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        <Download size={14} />
        Template
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        title="Upload CSV file"
        className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Import CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
