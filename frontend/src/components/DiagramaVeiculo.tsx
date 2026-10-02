import type { MouseEvent, ReactNode } from 'react'

export type Vista = 'teto' | 'lateral_esquerda' | 'lateral_direita'
export type Avaria = { vista: string; x: number; y: number; tipo: string }

// viewBox 400x200; as coordenadas salvas sao normalizadas 0..1 (ADR 003)
const W = 400
const H = 200

const LATERAL = (
  <>
    <path d="M22 132 V108 Q24 92 60 88 L128 82 L168 44 Q178 36 196 36 H272 Q288 36 300 48 L334 82 L368 90 Q384 96 384 114 V132 Z" />
    <path d="M140 82 L174 48 H226 V82 Z M236 82 V48 H276 Q286 48 294 58 L318 82 Z" />
    <circle cx="96" cy="138" r="28" />
    <circle cx="96" cy="138" r="12" />
    <circle cx="316" cy="138" r="28" />
    <circle cx="316" cy="138" r="12" />
  </>
)

const DESENHOS: Record<Vista, ReactNode> = {
  teto: (
    <>
      <rect x="20" y="36" width="360" height="128" rx="44" />
      <path d="M258 52 Q292 100 258 148 L222 140 Q238 100 222 60 Z" />
      <rect x="132" y="58" width="90" height="84" rx="10" />
      <path d="M102 56 Q82 100 102 144 L132 138 V62 Z" />
      <path d="M300 48 Q340 56 362 76 M300 152 Q340 144 362 124" />
      <rect x="240" y="22" width="18" height="14" rx="4" />
      <rect x="240" y="164" width="18" height="14" rx="4" />
    </>
  ),
  lateral_direita: LATERAL,
  // mesmo desenho espelhado: a frente fica para a esquerda
  lateral_esquerda: <g transform={`translate(${W} 0) scale(-1 1)`}>{LATERAL}</g>,
}

function Marca({ simbolo, x, y }: { simbolo: string; x: number; y: number }) {
  if (simbolo === 'O') return <circle cx={x} cy={y} r="9" />
  if (simbolo === '-') return <line x1={x - 11} y1={y} x2={x + 11} y2={y} />
  return <path d={`M${x - 9} ${y - 9} L${x + 9} ${y + 9} M${x + 9} ${y - 9} L${x - 9} ${y + 9}`} />
}

type Props = {
  vista: Vista
  avarias: Avaria[]
  simbolos: Record<string, string>
  rotulo: string
  // sem os handlers o diagrama e somente leitura
  onMarcar?: (x: number, y: number) => void
  onRemover?: (avaria: Avaria) => void
}

export function DiagramaVeiculo({ vista, avarias, simbolos, rotulo, onMarcar, onRemover }: Props) {
  function marcar(e: MouseEvent<SVGSVGElement>) {
    if (!onMarcar) return
    const r = e.currentTarget.getBoundingClientRect()
    const arredonda = (v: number) => Math.round(Math.min(Math.max(v, 0), 1) * 1000) / 1000
    onMarcar(arredonda((e.clientX - r.left) / r.width), arredonda((e.clientY - r.top) / r.height))
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${rotulo}: ${avarias.length} avaria(s) marcada(s)`}
      onClick={marcar}
      className={`w-full touch-manipulation rounded-xl bg-slate-50 ${onMarcar ? 'cursor-crosshair' : ''}`}
    >
      <g fill="none" stroke="#475569" strokeWidth="2" strokeLinejoin="round">
        {DESENHOS[vista]}
      </g>
      <g fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round">
        {avarias.map((a, i) => (
          <g
            key={i}
            onClick={(e) => {
              if (!onRemover) return
              e.stopPropagation()
              onRemover(a)
            }}
            className={onRemover ? 'cursor-pointer' : ''}
          >
            {/* area de toque maior que o desenho da marca */}
            <circle cx={a.x * W} cy={a.y * H} r="16" fill="transparent" stroke="none" />
            <Marca simbolo={simbolos[a.tipo] ?? 'X'} x={a.x * W} y={a.y * H} />
          </g>
        ))}
      </g>
    </svg>
  )
}
