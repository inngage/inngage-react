# Changelog

Todas as mudanças relevantes desta SDK são registradas aqui. O formato segue o
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o
[SemVer](https://semver.org/lang/pt-BR/).

## [4.3.0] - 2026-10-23

Registro de assinante na **Subscription API v4** da Inngage.

### Alterado

- `Inngage.subscribe` e `Inngage.addUserData` passam a chamar `POST /v4/subscription/` e
  `POST /v4/subscription/addCustomField`. Eventos (`sendEvent`) e reporte de abertura de
  notificação continuam na v1.
- `Inngage.subscribe` **exige o token FCM**. Se o token não puder ser obtido (Firebase mal
  configurado, `google-services.json`/`GoogleService-Info.plist` ausentes), nada é enviado, o log
  mostra `[INNGAGE] subscribe aborted: FCM token unavailable…` e a Promise é rejeitada. Antes a
  request saía com `registration: null`.
- Sem `friendlyIdentifier`, o dispositivo é registrado com um **UUID gerado pela SDK**, persistido
  no dispositivo (AsyncStorage `inngageUuid`) e reutilizado em todas as aberturas. O backend trata
  esse valor como identificador técnico: o login posterior com `friendlyIdentifier` promove o mesmo
  subscriber, sem duplicar. `DeviceInfo.getUniqueId()` não é mais usado como identifier.
- `platform` é enviado como `android` / `ios` (minúsculo), conforme a v4. Outros valores seriam
  classificados como "Outros" e não receberiam push.
- Payload do `subscribe` passa a trazer `opt_in` (estado real da permissão de notificação), `sdk`
  (versão da SDK; antes era o build number do app), `app_version` (versão do app), `os_name`,
  `os_version` (versão do sistema; antes era a versão do app) e `android_id` (Android). Chaves
  vazias (`''`, `{}`, `null`) não são mais enviadas. `phone_Number` passou a `phone_number`.
- `Inngage.addUserData`:
  - envia `app_token` (a v4 recusa o antigo `appToken`);
  - `identifier` é opcional e cai para o `friendlyIdentifier` do último `subscribe`; sem nenhum dos
    dois a Promise é rejeitada com `[INNGAGE] addUserData aborted: identifier is required`;
  - `customFields` precisa ser um objeto não vazio (exigência da API); caso contrário a Promise é
    rejeitada antes da chamada;
  - envia o token FCM em cache como `registration`, para que um subscriber anônimo criado no
    `subscribe` seja reivindicado pela pessoa.
- Erros HTTP incluem o corpo da resposta na mensagem do `Error`
  (`Inngage API 400 at /v4/subscription/: {...}`).

### Adicionado

- Com `Inngage.setDebugMode(true)` a SDK loga também a resposta da API
  (`INNGAGE RESPONSE SUBSCRIPTION: 201 {...}`), útil para conferir o `statusDescription`
  (`subscriberCreated`, `subscriberUpdated`, `identifierUpdated`, …).
- Dependência regular `react-native-uuid` (TypeScript puro, sem código nativo), instalada
  automaticamente com o pacote.

### Compatibilidade

- API pública sem mudanças de assinatura (`subscribe`, `sendEvent`, `addUserData`,
  `notificationListener`, `useInAppHandler`, `messagingHeadlessTask`). Novas rejeições de Promise
  descritas acima.
- Nova chave de AsyncStorage `inngageUuid`; demais inalteradas.
- Faixas de peers inalteradas. Requisitos: React Native >= 0.76, React Native Firebase 21–27
  (`app` e `messaging` na mesma versão), Node 22.11+.

### Checklist após atualizar

1. Com `Inngage.setDebugMode(true)`, a primeira abertura após instalação limpa mostra
   `INNGAGE PAYLOAD SUBSCRIPTION` com `identifier` em formato UUID, `platform: "android"` (ou
   `"ios"`), `opt_in` e `sdk: "4.3.0"`, seguido de `INNGAGE RESPONSE SUBSCRIPTION: 201` com
   `subscriberCreated`.
2. Aberturas seguintes respondem `200` com `subscriberUpdated` e o mesmo `identifier`.
3. `subscribe` com `friendlyIdentifier` após o login responde `identifierUpdated` ou
   `deviceAddedToExistingSubscriber`.
4. `addUserData` com `customFields` responde `200` com `"message": "Updated identifier [...]"`.
5. O subscriber aparece no painel Inngage com os campos enviados e recebe push em foreground,
   background e com o app fechado.

## [4.2.0] - 2026-10-22

- Suporte a React Native Firebase das versões 21 até 27 e React Native 0.76 ou superior
  (importações apenas pela API modular; tipos locais em vez de `FirebaseMessagingTypes`).
- Sem mudanças na API pública.
- iOS com React Native Firebase 27: Firebase via Swift Package Manager; `Podfile` com
  `use_frameworks! :linkage => :dynamic` e sem pods `Firebase*` explícitos.

## [4.1.2] - 2026-03-27

- Migração para a API modular do React Native Firebase e exibição de notificações em foreground
  via `@notifee/react-native`.
