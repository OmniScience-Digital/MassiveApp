import crypto from "crypto";

/**
 * Encrypts/decrypts the dynamic credential fields (tokens, keys, passwords)
 * before they ever reach DynamoDB. This file must only ever be imported from
 * server-side code (API routes) — never from a "use client" component.
 *
 * Key source: process.env.VAULT_ENCRYPTION_KEY, a 32-byte value provided as
 * base64. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * Set it as a secret in Amplify (never commit it), e.g.:
 *   npx ampx sandbox secret set VAULT_ENCRYPTION_KEY
 */

function getKey(): Buffer {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "VAULT_ENCRYPTION_KEY is not set. The credentials vault cannot encrypt/decrypt without it.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "VAULT_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).",
    );
  }
  return key;
}

/** Encrypts a plain JS object into a single base64 string: iv + authTag + ciphertext. */
export function encryptFields(fields: Record<string, string>): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(fields), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Reverses encryptFields. Throws if the key is wrong or data was tampered with. */
export function decryptFields(cipherB64: string): Record<string, string> {
  const key = getKey();
  const raw = Buffer.from(cipherB64, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
