import Link from 'next/link'
import { MapPin, X, Edit, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Branch } from '@/types/api'
import { cn } from '@/lib/utils'

interface BranchCardProps {
  branch: Branch
  onEdit?: (branch: Branch) => void
  onDelete?: (branch: Branch) => void
}

export function BranchCard({ branch, onEdit, onDelete }: BranchCardProps) {
  const colleges = branch.colleges || []

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEdit) {
      onEdit(branch)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(branch)
    }
  }

  return (
    <Link href={`/data/${branch.id}`} className="block">
      <Card className="hover:border-teal-600/50 transition-colors relative">
        {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="text-gray-400 hover:text-teal-400 transition-colors"
                title="Edit branch"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Delete branch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-start justify-between pr-8">
          <div className="flex items-start gap-3 flex-1">
            <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium break-words">{branch.name}</h3>
              {branch.city && (
                <p className="text-gray-400 text-sm mt-1">{branch.city}</p>
              )}
              {colleges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {colleges.map((college: any) => (
                    <Badge
                      key={college.id}
                      variant="published"
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                        "bg-green-500/20 text-green-400 border-green-500/30"
                      )}
                    >
                      <span className="text-sm font-medium">{college.name}</span>
                      <X className="w-3 h-3 text-green-400" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

