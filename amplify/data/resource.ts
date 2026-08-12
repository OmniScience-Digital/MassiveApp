import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Sites: a
    .model({
      site: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Dashboards: a
    .model({
      items: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  AuditorReports: a
    .model({
      siteId: a.string().required(),
      date: a.date().required(),
      scales: a.json().required(),
    })
    .secondaryIndexes((index) => [index("siteId").sortKeys(["date"])])
    .authorization((allow) => [allow.publicApiKey()]),

  InputTable: a
    .model({
      siteId: a.string().required(),
      iccid: a.string().required(),
      rowdate: a.date().required(),
      inputValues: a.json(), // { "00": "1", "01": "2", ..., "23": "3" }
    })
    .secondaryIndexes((index) => [index("siteId").sortKeys(["rowdate"])])
    .authorization((allow) => [allow.publicApiKey()]),

  StatusReportConfig: a
    .model({
      checks: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PurplefigureTable: a
    .model({
      siteId: a.string().required(),
      iccid: a.string().required(),
      rowdate: a.date().required(),
      purpleValues: a.json(), // { "00": "1", "01": "2", ..., "23": "3" }
      dayTotal: a.string().required(),
    })
    .secondaryIndexes((index) => [index("siteId").sortKeys(["rowdate"])])
    .authorization((allow) => [allow.publicApiKey()]),

  // --- Admin credentials vault -----------------------------------------
  // fieldsCipher holds the AES-256-GCM ciphertext of the dynamic key/value
  // fields (e.g. { token: "...", region: "..." }). The API/server route is
  // the only place that ever encrypts/decrypts — the raw plaintext never
  // touches this table or the client except at reveal time.
  Credential: a
    .model({
      kind: a.string().required(), // "github" | "aws" | "custom" (dynamic — not an enum, so new kinds don't need a schema change)
      name: a.string().required(), // e.g. "GitHub - Org PAT"
      fieldsCipher: a.string().required(), // encrypted JSON blob of dynamic fields
      fieldNames: a.string().array(), // labels only (safe to list without decrypting), e.g. ["Token","Scopes"]
      notes: a.string(),
      url: a.string(),
      tags: a.string().array(),
      createdBy: a.string(),
      updatedBy: a.string(),
      lastRotatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.group("ADMIN")]),
  // --- Telegram group monitor ------------------------------------------
  // One well-known row (id: "global"), same pattern as StatusReportConfig.
  // companyUserIds excludes internal staff from personal-DM keyword routing
  // (their keyword matches route to alertChatId instead); alertChatId is
  // the centralized chat used for tag matches (always) and keyword matches
  // from ignored senders.
  // NOTE: keywords used to live here as one shared global list — as of the
  // per-user keyword revision, keywords moved to TelegramUserKeyword below.
  TelegramMonitorConfig: a
    .model({
      companyUserIds: a.string().array(), // Telegram numeric user ids, as strings
      alertChatId: a.string(), // centralized chat id
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // One row per staff member (id = their Telegram numeric user id), holding
  // their own personal keyword list. Self-managed via the @<bot> keyword=...,
  // delete_keyword=..., print_keyword chat commands — this table is
  // READ-ONLY from the dashboard, same as companyUserIds above.
  TelegramUserKeyword: a
    .model({
      username: a.string(),
      displayName: a.string(),
      keywords: a.string().array(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
