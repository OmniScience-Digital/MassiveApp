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
    }).authorization((allow) => [allow.publicApiKey()]),

  AuditorReports: a.model({
    siteId: a.string().required(),
    date: a.date().required(),
    scales: a.json().required()
  }).secondaryIndexes((index) => [index("siteId").sortKeys(["date"])])
    .authorization((allow) => [allow.publicApiKey()]),

  InputValueTable: a
    .model({
      siteId: a.string().required(),  // Unique identifier
      timestamp: a.string(), // ISO 8601 timestamp
      data: a.json(),        // JSON array: [{ iccid: string, inputValues: {} }]
    }).secondaryIndexes((index) => [index("siteId")])
    .authorization((allow) => [allow.publicApiKey()]),

  Purplefigures: a
    .model({
      siteId: a.string().required(),
      timestamp: a.string(),
      firstdate: a.string().required(), // '2025-07-25'
      lastdate: a.string().required(),  // '2025-08-28'
      data: a.json(), // JSON array: [{ iccid: string, purpleValues: {} }]
    }).secondaryIndexes((index) => [
      index("siteId"),
      index("firstdate"),
      index("lastdate")
    ])
    .authorization((allow) => [allow.publicApiKey()])
})

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});


