import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ReportDetailsProps {
  report: {
    id: string
    reportNumber: string
    branch: string
    faculty: string
    level: string
    dateReported: string
    scheduleId: string
    description: string
    status: 'new' | 'in_progress' | 'resolved'
    adminNotes: string
  }
  onStatusChange: (status: string) => void
  onNotesChange: (notes: string) => void
  onSave: () => void
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export function ReportDetails({
  report,
  onStatusChange,
  onNotesChange,
  onSave,
}: ReportDetailsProps) {
  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-4">REPORT DETAILS & RESOLUTION</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Branch / Faculty / Level</label>
            <p className="text-white">
              {report.branch} / {report.faculty} / {report.level}
            </p>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Date Reported / Schedule ID</label>
            <p className="text-white">
              {report.dateReported} / {report.scheduleId}
            </p>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">
            Issue Description (Reported by TA)
          </label>
          <Textarea
            value={report.description}
            readOnly
            rows={3}
            className="bg-gray-800 text-gray-300"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Resolution Status</label>
          <Select
            options={statusOptions}
            value={report.status}
            onChange={(e) => onStatusChange(e.target.value)}
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Admin Notes / Resolution Steps</label>
          <Textarea
            value={report.adminNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Enter notes on how this conflict was resolved"
            rows={6}
            className="bg-gray-800 text-white"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onSave}>
            Save Admin Notes
          </Button>
        </div>
      </div>
    </Card>
  )
}

