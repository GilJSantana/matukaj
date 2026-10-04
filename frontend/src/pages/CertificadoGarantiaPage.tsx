import { useEffect, useState } from 'react'
import { Assinaturas, Dado, Documento, Secao, TabelaItens } from '../components/Documento'
import { formatarData, formatarDocumento } from '../services/formatos'
import { supabase } from '../services/supabase'

const consultar = (id: number) =>
  supabase!
    .from('ordens_servico')
    .select('*, clientes(*), veiculos(*), itens_os(*), garantias(*)')
    .eq('id', id)
    .order('id', { referencedTable: 'itens_os' })
    .single()
type OS = NonNullable<Awaited<ReturnType<typeof consultar>>['data']>

function somarMeses(data: string, meses: number) {
  const fim = new Date(data)
  fim.setMonth(fim.getMonth() + meses)
  return fim
}

export function CertificadoGarantiaPage({ osId, onVoltar }: { osId: number; onVoltar: () => void }) {
  const [os, setOs] = useState<OS>()

  useEffect(() => {
    consultar(osId).then(({ data }) => data && setOs(data))
  }, [osId])

  if (!os?.garantias) return null
  const { clientes: cliente, veiculos: veiculo, garantias: garantia } = os

  return (
    <Documento titulo="Certificado de garantia" subtitulo={`Nº ${garantia.id} · OS nº ${os.id}`} onVoltar={onVoltar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Secao titulo="Cliente">
          <Dado rotulo="Nome">{cliente.nome}</Dado>
          <Dado rotulo="CPF/CNPJ">{formatarDocumento(cliente.cpf_cnpj)}</Dado>
        </Secao>
        <Secao titulo="Veículo">
          <Dado rotulo="Placa">{veiculo.placa}</Dado>
          <Dado rotulo="Modelo">{[veiculo.marca, veiculo.modelo, veiculo.ano].filter(Boolean).join(' · ') || '—'}</Dado>
          <Dado rotulo="Nº do motor">{veiculo.numero_motor ?? '—'}</Dado>
        </Secao>
      </div>

      <Secao titulo="Cobertura">
        <div className="rounded-lg border-2 border-slate-900 p-3 text-center">
          <p className="text-lg font-bold">
            {garantia.prazo_meses} {garantia.prazo_meses === 1 ? 'mês' : 'meses'}
            {garantia.km_limite && ` ou ${garantia.km_limite.toLocaleString('pt-BR')} km`}
          </p>
          {garantia.km_limite && <p className="text-xs">o que ocorrer primeiro</p>}
          <p className="mt-1">
            Válida de {formatarData(garantia.emitida_em)} até {formatarData(somarMeses(garantia.emitida_em, garantia.prazo_meses))}
            {garantia.km_limite && os.km_entrada !== null &&
              ` ou até o odômetro marcar ${(os.km_entrada + garantia.km_limite).toLocaleString('pt-BR')} km`}
          </p>
        </div>
      </Secao>

      <Secao titulo="Serviços cobertos">
        <TabelaItens itens={os.itens_os} />
      </Secao>

      {garantia.condicoes && (
        <Secao titulo="Condições da garantia">
          <p className="text-xs leading-relaxed whitespace-pre-line">{garantia.condicoes}</p>
        </Secao>
      )}

      <Assinaturas nomes={['Retífica (responsável técnico)', 'Cliente']} />
    </Documento>
  )
}
