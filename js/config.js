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
  url: 'https://wauxtuxwxyeqohbtkgav.supabase.co',
  chave: 'sb_publishable_dRmhN69s-KpuPvVsVX7Ijw_r42WmTps',
  // Lembretes (D46): chave PÚBLICA VAPID, o "crachá" que o celular confere em cada
  // notificação. A chave privada fica só nos segredos da função no Supabase.
  vapidPublica: 'BIXKaj97QLomh1CtYYzcqocSE3sf-2hclLJjsEPj5ozo1ZTCMDSo0_GSofJUMbjAfmCjN1mqzDIim6nVSNN0Ads',
};
