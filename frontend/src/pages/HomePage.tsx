import { UserPlus } from 'lucide-react'
import { AtendimentosAtivos } from '../components/AtendimentosAtivos'
import { Botao } from '../components/Botao'
import { BuscaRapida } from '../components/BuscaRapida'

export function HomePage({
  onAbrirCliente,
  onAbrirOS,
}: {
  onAbrirCliente: (id: number | null) => void
  onAbrirOS: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2">
        <BuscaRapida onAbrir={onAbrirCliente} onNovo={() => onAbrirCliente(null)} />
        <Botao onClick={() => onAbrirCliente(null)} className="py-3" aria-label="Novo cliente">
          <UserPlus className="size-4" aria-hidden /> <span className="max-sm:hidden">Novo cliente</span>
        </Botao>
      </div>
      <AtendimentosAtivos onAbrir={onAbrirOS} />
    </div>
  )
}
