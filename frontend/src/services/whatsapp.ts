// ADR 002: telefone so com digitos, prefixo 55 + DDD + numero
export function normalizarTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '')
  if (!digitos) return null
  return digitos.length <= 11 ? `55${digitos}` : digitos
}

export function linkWhatsApp(telefone: string, mensagem: string) {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
}

