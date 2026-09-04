export function printDocument(
  title: string,
  options?: { landscape?: boolean },
): void {
  const previousTitle = document.title
  document.title = title

  const pageStyle = document.createElement('style')
  pageStyle.id = 'ekem-print-page-style'
  pageStyle.textContent = options?.landscape
    ? '@page { size: A4 landscape; margin: 10mm; }'
    : '@page { size: A4 portrait; margin: 12mm; }'
  document.head.appendChild(pageStyle)

  const restore = () => {
    document.title = previousTitle
    pageStyle.remove()
    window.removeEventListener('afterprint', restore)
  }

  window.addEventListener('afterprint', restore)
  window.print()
  window.setTimeout(restore, 1000)
}
