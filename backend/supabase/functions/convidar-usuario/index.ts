// US-34 / ADR 004: convite exige a service_role, que nunca vai para o navegador
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const PAPEIS = ['admin', 'atendente', 'mecanico']

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  // cliente com o JWT de quem chamou: is_admin() avalia o usuario real
  const solicitante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: admin } = await solicitante.rpc('is_admin')
  if (!admin) return json({ error: 'Somente administradores convidam usuários.' }, 403)

  const { email, papel } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) return json({ error: 'E-mail inválido.' }, 400)
  if (!PAPEIS.includes(papel)) return json({ error: 'Papel inválido.' }, 400)

  const servico = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await servico.auth.admin.inviteUserByEmail(email.trim())
  if (error) return json({ error: error.message }, 400)

  // o trigger criou o perfil como mecanico
  const { error: erroPerfil } = await servico.from('perfis').update({ papel }).eq('id', data.user.id)
  if (erroPerfil) return json({ error: erroPerfil.message }, 500)
  return json({ id: data.user.id })
})
