type EkemBrandProps = {
  layout?: 'horizontal' | 'stacked'
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  showSubtitle?: boolean
  className?: string
}

const LOGO_SIZES = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
} as const

const TITLE_SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
} as const

export function EkemBrand({
  layout = 'horizontal',
  size = 'sm',
  showTagline = true,
  showSubtitle = false,
  className = '',
}: EkemBrandProps) {
  const isStacked = layout === 'stacked'

  return (
    <div
      className={`flex ${isStacked ? 'flex-col items-center text-center' : 'items-center gap-3'} ${className}`}
    >
      <img
        src="/ekem-pharmacy-logo.png"
        alt="Ekem Pharmacy logo"
        className={`${LOGO_SIZES[size]} shrink-0 rounded-full object-contain`}
      />

      <div className={isStacked ? 'mt-3' : 'min-w-0'}>
        <p className={`font-semibold text-[var(--color-primary)] ${TITLE_SIZES[size]}`}>
          Ekem Pharmacy
        </p>
        {showTagline ? (
          <p className="text-xs font-semibold text-[var(--color-accent)]">We&apos;re Here For You!</p>
        ) : null}
        {showSubtitle ? (
          <p className="text-xs text-[var(--color-muted)]">Manager Control Centre</p>
        ) : null}
      </div>
    </div>
  )
}
