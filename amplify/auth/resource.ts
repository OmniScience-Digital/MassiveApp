import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_SECRET"),
        scopes: ["profile", "email"],
        attributeMapping: {
          email: "email",
        },
      },
      callbackUrls: [
        "http://localhost:3000/landing",
        "https://main.d1d7dmip95q0zl.amplifyapp.com/landing",
        "https://test.d1d7dmip95q0zl.amplifyapp.com/landing",
      ],
      logoutUrls: [
        "http://localhost:3000",
        "https://main.d1d7dmip95q0zl.amplifyapp.com",
        "https://test.d1d7dmip95q0zl.amplifyapp.com",
      ],
    },
  },
});
