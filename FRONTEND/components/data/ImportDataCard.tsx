import Link from 'next/link'
import { Upload } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function ImportDataCard() {
  return (
    <Link href="/data/import">
      <Card className="hover:border-teal-600/50 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600/20 rounded-lg">
            <Upload className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2">IMPORT SYSTEM DATA</h3>
            <p className="text-gray-400 text-sm">
              Bulk upload EXCEL/JSON files directly into the system database.
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

