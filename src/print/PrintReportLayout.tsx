import type { ReactNode } from 'react'

type PrintReportLayoutProps = {
  reportTitle: string
  periodLabel: string
  generatedAt: Date
  orientation?: 'portrait' | 'landscape'
  children: ReactNode
  footerNote?: string
}

function formatGenerated(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export function PrintReportLayout({
  reportTitle,
  periodLabel,
  generatedAt,
  orientation = 'portrait',
  children,
  footerNote,
}: PrintReportLayoutProps) {
  return (
    <div
      className={`print-report ${
        orientation === 'landscape' ? 'print-landscape' : 'print-portrait'
      }`}
    >
      <div className="print-brand-bar" aria-hidden="true" />

      <header className="print-report-header">
        <div className="print-brand-row">
          <img
            src="/ekem-pharmacy-logo.png"
            alt="Ekem Pharmacy logo"
            className="print-logo"
          />
          <div className="print-brand-text">
            <p className="print-brand">Ekem Pharmacy</p>
            <p className="print-tagline">We&apos;re Here For You!</p>
          </div>
        </div>
        <h1 className="print-title">{reportTitle}</h1>
        <p className="print-meta">
          <strong>Report period:</strong> {periodLabel}
        </p>
        <p className="print-meta">
          <strong>Generated:</strong> {formatGenerated(generatedAt)}
        </p>
      </header>

      <div className="print-report-body">{children}</div>

      <footer className="print-report-footer">
        <div className="print-signoff">
          <p>Prepared by: ______________________________</p>
          <p>Date: ______________________________</p>
        </div>
        {footerNote ? <p className="print-footnote">{footerNote}</p> : null}
      </footer>
    </div>
  )
}
