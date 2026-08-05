import { cookies } from "next/headers";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";

export type AdminSession = {
  userId: string;
  displayName: string;
};

/**
 * Verifies the caller is authenticated AND carries the ADMIN group claim.
 * Returns null if not — callers should respond 403.
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (context) => {
        const session = await fetchAuthSession(context, {});
        const groups =
          (session.tokens?.idToken?.payload["cognito:groups"] as
            | string[]
            | undefined) ?? [];
        if (!groups.includes("ADMIN")) return null;

        const user = await getCurrentUser(context);
        const displayName =
          (session.tokens?.idToken?.payload?.email as string | undefined) ??
          user.username;

        return { userId: user.userId, displayName };
      },
    });
    return result;
  } catch {
    return null;
  }
}

/** A data client authenticated as the current user, so allow.group("ADMIN") rules apply. */
export const vaultDataClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
  authMode: "userPool",
});
