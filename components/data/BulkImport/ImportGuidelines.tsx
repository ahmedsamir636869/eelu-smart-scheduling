import { Info, FileDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ImportGuidelines() {
  const handleDownloadTemplate = () => {
    // In real app, this would download a template file
    console.log('Download template')
    // window.open('/templates/import-template.xlsx', '_blank')
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-3">Import Guidelines</h3>
          <ul className="space-y-2 text-gray-400 text-sm mb-4">
            <li>• Files must follow the system schema.</li>
            <li>• IDs must be unique per branch.</li>
          </ul>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              icon={<FileDown className="w-4 h-4" />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

