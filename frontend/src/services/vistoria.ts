import type { Vista } from '../components/DiagramaVeiculo'

// definicao versionada em checklist_modelos (ADR 003)
export type ModeloChecklist = {
  itens: { chave: string; rotulo: string }[]
  tipos_avaria: { chave: string; rotulo: string; simbolo: string }[]
}

export const VISTAS: { vista: Vista; rotulo: string }[] = [
  { vista: 'teto', rotulo: 'Superior' },
  { vista: 'lateral_esquerda', rotulo: 'Lateral esquerda' },
  { vista: 'lateral_direita', rotulo: 'Lateral direita' },
]

// indice = vistorias.nivel_combustivel
export const COMBUSTIVEL = ['Vazio', '1/4', '1/2', '3/4', 'Cheio']
