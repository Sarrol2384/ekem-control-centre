import type { ReactNode } from 'react'
import { printDocument } from './printDocument'

type PrintPreviewModalProps = {
  open: boolean
  title: string
  landscape?: boolean
  onClose: () => void
  children: ReactNode
}

export function PrintPreviewModal({
  open,
  title,
  landscape = false,
  onClose,
  children,
}: PrintPreviewModalProps) {
  if (!open) return null

  function handlePrint() {
    printDocument(title, { landscape })
  }

  return (
    <div className="print-preview-overlay" role="dialog" aria-modal="true" aria-label="Print preview">
      <div className="print-preview-chrome no-print">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Print preview</p>
          <p className="text-xs text-[var(--color-muted)]">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={handlePrint}>
            Print
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className={`print-preview-sheet ${landscape ? 'print-preview-sheet-landscape' : ''}`}>
        {children}
      </div>
    </div>
  )
}
