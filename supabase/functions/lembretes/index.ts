// Função "lembretes" (Supabase Edge Function, D46).
// Roda todo dia às 9h (pg_cron) e manda notificação push para as contas fixas
// que vencem HOJE ou AMANHÃ e ainda não foram pagas. Também atende o botão
// "Enviar um teste" do app.
//
// Por que um servidor: com o app fechado, o iPhone não executa nada do Sobra.
// Quem "acorda" e avisa é a nuvem, como fazem os apps de banco.
//
// O envio segue o padrão Web Push (RFC 8291 + VAPID, RFC 8292), escrito só com
// WebCrypto: sem biblioteca externa, e testável fora do Supabase.
//
// Segredos (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// LEMBRETES_TOKEN. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já fornece.

const FUSO = 'America/Sao_Paulo';
const APP_URL = 'https://brunofsposito.github.io/financas-app/';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------- Regras: quais contas avisar ----------

// 'AAAA-MM-DD' de hoje no fuso de Brasília
export function hojeEmBrasilia(agora = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: FUSO });
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// Mesma regra do app (contas.js): dia 31 em mês curto vira o último dia
function venceEm(conta: { dia: number }, ano: number, mes: number): number {
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return Math.min(conta.dia, ultimo);
}

// contas e lancamentos como vêm do banco (colunas em snake_case).
// Devolve [{ user_id, conta, quando: 'hoje' | 'amanha', competencia }]
export function lembretesDoDia(contas: any[], lancamentos: any[], hoje: string) {
  const pagos = new Set(lancamentos.filter((l) => l.conta_id).map((l) => `${l.user_id}|${l.conta_id}|${l.competencia}`));
  const avisos = [];
  for (const [quando, data] of [['hoje', hoje], ['amanha', somarDias(hoje, 1)]]) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const comp = data.slice(0, 7);
    for (const conta of contas) {
      if ((conta.movimento || 'saida') !== 'saida') continue; // entrada fixa não "vence"
      if (conta.inicio > comp) continue; // o fixo ainda não valia nesse mês
      if (venceEm(conta, ano, mes) !== dia) continue;
      if (pagos.has(`${conta.user_id}|${conta.id}|${comp}`)) continue; // já pago: não avisa
      avisos.push({ user_id: conta.user_id, conta, quando, competencia: comp });
    }
  }
  return avisos;
}

export function mensagem({ conta, quando, competencia }: any) {
  const valor = (conta.valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return {
    titulo: `${conta.descricao} vence ${quando === 'hoje' ? 'hoje' : 'amanhã'}`,
    corpo: `${valor} · toque para abrir o Sobra`,
    url: APP_URL,
    tag: `${conta.id}-${competencia}-${quando}`, // repetido? o iPhone substitui em vez de duplicar
  };
}

// ---------- Web Push: criptografia (RFC 8291) e assinatura VAPID (RFC 8292) ----------

const texto = new TextEncoder();

export function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deB64url(s: string): Uint8Array {
  const base = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base + '='.repeat((4 - (base.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function juntar(...partes: Uint8Array[]): Uint8Array {
  const total = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) { total.set(p, i); i += p.length; }
  return total;
}

async function hkdf(sal: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: sal, info }, chave, bytes * 8);
  return new Uint8Array(bits);
}

// Cifra a mensagem para UM aparelho (só ele tem a chave para abrir). Formato aes128gcm.
export async function cifrar(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  const publicaAparelho = deB64url(p256dh);
  const segredoAparelho = deB64url(auth);
  const efemera = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const publicaServidor = new Uint8Array(await crypto.subtle.exportKey('raw', efemera.publicKey));
  const chaveAparelho = await crypto.subtle.importKey('raw', publicaAparelho, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const compartilhado = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: chaveAparelho }, efemera.privateKey, 256));

  const ikm = await hkdf(segredoAparelho, compartilhado,
    juntar(texto.encode('WebPush: info\0'), publicaAparelho, publicaServidor), 32);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sal, ikm, texto.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(sal, ikm, texto.encode('Content-Encoding: nonce\0'), 12);

  const chaveAes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const claro = juntar(texto.encode(payload), new Uint8Array([2])); // 2 = último bloco
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, chaveAes, claro));

  const cabecalho = new Uint8Array(16 + 4 + 1 + publicaServidor.length);
  cabecalho.set(sal, 0);
  new DataView(cabecalho.buffer).setUint32(16, 4096); // tamanho do bloco
  cabecalho[20] = publicaServidor.length;
  cabecalho.set(publicaServidor, 21);
  return juntar(cabecalho, cifrado);
}

// "Crachá" do servidor (VAPID): um JWT assinado que prova para a Apple/Google
// que a mensagem vem do mesmo servidor que o aparelho autorizou.
export async function assinaturaVapid(endpoint: string, publica: string, privada: string, contato: string): Promise<string> {
  const pub = deB64url(publica); // 65 bytes: 0x04 || x || y
  const jwk = { kty: 'EC', crv: 'P-256', d: privada, x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)), ext: true };
  const chave = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const cabecalho = b64url(texto.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const corpo = b64url(texto.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: contato,
  })));
  const assinatura = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, chave, texto.encode(`${cabecalho}.${corpo}`)));
  return `vapid t=${cabecalho}.${corpo}.${b64url(assinatura)}, k=${publica}`;
}

export async function enviarPush(inscricao: any, dados: object, vapid: { publica: string; privada: string; contato: string }) {
  const corpo = await cifrar(JSON.stringify(dados), inscricao.p256dh, inscricao.auth);
  return fetch(inscricao.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await assinaturaVapid(inscricao.endpoint, vapid.publica, vapid.privada, vapid.contato),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400', // se o celular estiver desligado, a mensagem espera até 1 dia
      Urgency: 'normal',
    },
    body: corpo,
  });
}

// ---------- O serviço ----------

function resposta(dados: object, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function atender(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const env = (nome: string) => Deno.env.get(nome) || '';
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  // service_role: lê as contas de todos para o envio diário. Fica SÓ aqui no servidor.
  const banco = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const vapid = { publica: env('VAPID_PUBLIC_KEY'), privada: env('VAPID_PRIVATE_KEY'), contato: env('VAPID_SUBJECT') || APP_URL };

  // Quem pode chamar: o agendamento diário (com o token secreto) ou um usuário logado (só o teste dele)
  const ehAgendamento = env('LEMBRETES_TOKEN') && req.headers.get('x-lembretes-token') === env('LEMBRETES_TOKEN');
  let usuarioTeste: string | null = null;
  if (!ehAgendamento) {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data } = token ? await banco.auth.getUser(token) : { data: null };
    if (!data || !data.user) return resposta({ erro: 'não autorizado' }, 401);
    usuarioTeste = data.user.id;
  }

  let envios: { user_id: string; dados: object }[];
  if (usuarioTeste) {
    envios = [{ user_id: usuarioTeste, dados: { titulo: 'Lembretes ligados', corpo: 'É assim que o Sobra vai avisar das contas, 1 dia antes e no dia, às 9h.', url: APP_URL, tag: 'teste' } }];
  } else {
    const hoje = hojeEmBrasilia();
    const comps = [hoje.slice(0, 7), somarDias(hoje, 1).slice(0, 7)];
    const { data: contas, error: e1 } = await banco.from('contas').select('user_id,id,descricao,valor,dia,inicio,movimento');
    const { data: lancs, error: e2 } = await banco.from('lancamentos').select('user_id,conta_id,competencia').in('competencia', comps);
    if (e1 || e2) return resposta({ erro: (e1 || e2).message }, 500);
    envios = lembretesDoDia(contas, lancs, hoje).map((a) => ({ user_id: a.user_id, dados: mensagem(a) }));
  }

  const usuarios = [...new Set(envios.map((e) => e.user_id))];
  const { data: inscricoes } = usuarios.length
    ? await banco.from('lembretes_push').select('*').in('user_id', usuarios)
    : { data: [] };

  let enviados = 0;
  const vencidas: string[] = [];
  for (const envio of envios) {
    for (const inscricao of (inscricoes || []).filter((i: any) => i.user_id === envio.user_id)) {
      const r = await enviarPush(inscricao, envio.dados, vapid);
      if (r.ok) enviados++;
      else if (r.status === 404 || r.status === 410) vencidas.push(inscricao.endpoint); // celular desinstalou/desativou
      else console.error('push falhou', r.status, await r.text());
    }
  }
  if (vencidas.length) await banco.from('lembretes_push').delete().in('endpoint', vencidas);
  return resposta({ avisos: envios.length, enviados, removidas: vencidas.length });
}

// No Supabase (Deno), sobe o serviço. Nos testes (Node), só as funções acima são usadas.
if (typeof Deno !== 'undefined') Deno.serve(atender);
