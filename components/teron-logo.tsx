type TeronLogoProps = {
  /** so o simbolo (+) */
  markOnly?: boolean
  /** altura em px */
  height?: number
  className?: string
  href?: string | null
}

/**
 * Logo oficial TERON.
 * Arquivos em /public:
 *  - logo-mark.svg  → simbolo
 *  - logo-wordmark.svg → simbolo + texto
 *  - logo.svg → sinonimo do mark
 *
 * Se voce adicionar arquivos novos (ex: logo.png), troque os paths abaixo.
 */
export function TeronLogo({
  markOnly = false,
  height = 28,
  className = '',
  href = '/',
}: TeronLogoProps) {
  const src = markOnly ? '/logo-mark.svg' : '/logo-wordmark.svg'
  const width = markOnly ? height : Math.round(height * (148 / 36))

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="TERON"
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', height, width: 'auto' }}
    />
  )

  if (href === null) return img
  return (
    <a href={href} className="logo" aria-label="TERON — inicio" style={{ textDecoration: 'none' }}>
      {img}
    </a>
  )
}
