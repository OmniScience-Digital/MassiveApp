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

  // Exclusive "one admin in the vault at a time" lock. Single global row.
  VaultLock: a
    .model({
      lockId: a.string().required(), // always "GLOBAL"
      holderId: a.string().required(),
      holderName: a.string().required(),
      acquiredAt: a.datetime().required(),
      expiresAt: a.datetime().required(),
    })
    .identifier(["lockId"])
    .authorization((allow) => [allow.group("ADMIN")]),

  // Append-only audit trail: every lock/unlock/view/create/edit/delete.
  VaultAuditLog: a
    .model({
      action: a.string().required(), // "lock" | "unlock" | "takeover" | "view" | "create" | "update" | "delete"
      actorId: a.string().required(),
      actorName: a.string().required(),
      credentialId: a.string(),
      credentialName: a.string(),
      detail: a.string(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.group("ADMIN")]),
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
