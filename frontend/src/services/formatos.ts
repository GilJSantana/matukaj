// mascaras para exibicao; o banco guarda so digitos

export function formatarDocumento(digitos: string | null) {
  if (!digitos) return '—'
  return digitos.length === 11
    ? digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// 55 + DDD + numero -> (11) 98765-4321
export function formatarTelefone(telefone: string | null) {
  if (!telefone) return '—'
  return telefone.slice(2).replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

export const formatarData = (data: string | Date) => new Date(data).toLocaleDateString('pt-BR')
export const formatarDataHora = (data: string) =>
  new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
