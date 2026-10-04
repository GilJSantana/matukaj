import { ArrowLeft, Printer } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { formatarDocumento, formatarTelefone } from '../services/formatos'
import { reais, totalItens } from '../services/os'
import { supabase, type Oficina } from '../services/supabase'
import { Botao } from './Botao'

type Props = { titulo: string; subtitulo: string; onVoltar: () => void; children: ReactNode }

// pagina A4: o "Salvar como PDF" do navegador gera o arquivo
export function Documento({ titulo, subtitulo, onVoltar, children }: Props) {
  const [oficina, setOficina] = useState<Oficina>()

  useEffect(() => {
    supabase!.from('oficina_config').select().single().then(({ data }) => data && setOficina(data))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={onVoltar} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </button>
        <Botao onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Imprimir / Salvar PDF
        </Botao>
      </div>

      <article className="flex flex-col gap-5 bg-white p-4 text-sm sm:p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3">
          <div>
            <p className="text-lg font-bold">{oficina?.razao_social}</p>
            {oficina?.cnpj && <p>CNPJ {formatarDocumento(oficina.cnpj)}</p>}
            {oficina?.endereco && <p>{oficina.endereco}</p>}
            {oficina?.telefone && <p>Tel./WhatsApp {formatarTelefone(oficina.telefone)}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase">{titulo}</h2>
            <p className="text-slate-600">{subtitulo}</p>
          </div>
        </header>
        {children}
      </article>
    </div>
  )
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-2 border-b border-slate-300 pb-1 text-xs font-bold tracking-wide text-slate-600 uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

export function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <p>
      <span className="text-slate-500">{rotulo}: </span>
      {children}
    </p>
  )
}

type Item = { id: number; descricao: string; quantidade: number; valor_unitario: number }

export function TabelaItens({ itens }: { itens: Item[] }) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-slate-500">
          <th className="py-1 font-medium">Descrição</th>
          <th className="py-1 text-right font-medium">Qtd.</th>
          <th className="py-1 text-right font-medium">Valor unit.</th>
          <th className="py-1 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((i) => (
          <tr key={i.id} className="border-t border-slate-200">
            <td className="py-1">{i.descricao}</td>
            <td className="py-1 text-right">{i.quantidade}</td>
            <td className="py-1 text-right">{reais(i.valor_unitario)}</td>
            <td className="py-1 text-right">{reais(i.quantidade * i.valor_unitario)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-900 font-bold">
          <td colSpan={3} className="py-1 text-right">
            Total
          </td>
          <td className="py-1 text-right">{reais(totalItens(itens))}</td>
        </tr>
      </tfoot>
    </table>
    </div>
  )
}

export function Assinaturas({ nomes }: { nomes: string[] }) {
  return (
    <div className="mt-10 grid break-inside-avoid grid-cols-2 gap-6 sm:gap-12">
      {nomes.map((nome) => (
        <p key={nome} className="border-t border-slate-900 pt-1 text-center text-xs">
          {nome}
        </p>
      ))}
    </div>
  )
}
