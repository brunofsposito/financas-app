// Configuração da nuvem (Supabase). Preencha com os dados do SEU projeto:
// Supabase → Project Settings → API (ou "Connect") → Project URL e a chave
// "anon"/"publishable".
//
// Pode ficar no repositório público? Sim: essa chave é PÚBLICA por design
// (vai para o navegador de qualquer forma). Quem protege os dados é o RLS
// no banco (supabase/schema.sql): cada pessoa só enxerga as próprias linhas.
// NUNCA coloque aqui a chave "service_role"/"secret": ela ignora o RLS.
//
// Enquanto estiver vazio, o app funciona só no celular, como antes.

const CONFIG_NUVEM = {
  url: '',
  chave: '',
};
