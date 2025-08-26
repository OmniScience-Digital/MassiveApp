import { defineAuth, secret } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,

  //   //add social providers
  //   externalProviders: {
  //     google: {
  //       clientId: secret("GOOGLE_CLIENT_ID"),
  //       clientSecret: secret("GOOGLE_SECRET"),
  //       scopes: ["email"]
  //     },
  //     callbackUrls: ["http://localhost:3000/"],
  //     logoutUrls: ["http://localhost:3000/"]
  //   }
  // },
      
  }
});


