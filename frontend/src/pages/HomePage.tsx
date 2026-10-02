import { UserPlus } from 'lucide-react'
import { Aniversariantes } from '../components/Aniversariantes'
import { Botao } from '../components/Botao'
import { BuscaRapida } from '../components/BuscaRapida'

export function HomePage({ onAbrirCliente }: { onAbrirCliente: (id: number | null) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Aniversariantes onAbrir={onAbrirCliente} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Clientes</h2>
        <Botao onClick={() => onAbrirCliente(null)}>
          <UserPlus className="size-4" aria-hidden /> Novo cliente
        </Botao>
      </div>
      <BuscaRapida onAbrir={onAbrirCliente} />
    </div>
  )
}
