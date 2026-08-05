export type VaultKind = "github" | "aws" | "custom";

export const VAULT_KIND_LABELS: Record<VaultKind, string> = {
  github: "GitHub",
  aws: "AWS",
  custom: "Custom",
};

export const VAULT_KIND_PRESET_FIELDS: Record<VaultKind, string[]> = {
  github: ["Personal Access Token", "Scopes"],
  aws: ["Access Key ID", "Secret Access Key", "Region"],
  custom: ["Value"],
};

export const VAULT_KIND_DEFAULT_URL: Record<VaultKind, string> = {
  github: "https://github.com/settings/tokens",
  aws: "https://console.aws.amazon.com/iam/home",
  custom: "",
};
