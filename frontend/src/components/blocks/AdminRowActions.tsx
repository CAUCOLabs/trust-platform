import { Button } from '../ui/Button'

interface AdminRowActionsProps {
  onEdit: () => void
  onDelete: () => void
  deleteDisabled?: boolean
}

export function AdminRowActions({ onEdit, onDelete, deleteDisabled = false }: AdminRowActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={onEdit} className="px-4 py-2 text-xs sm:w-auto">
        Edit
      </Button>
      <Button type="button" variant="danger" onClick={onDelete} disabled={deleteDisabled} className="px-4 py-2 text-xs sm:w-auto">
        Delete
      </Button>
    </div>
  )
}
