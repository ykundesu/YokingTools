export interface OwnerAuthConfig {
  allowedDiscordUserId: string;
  rpId: string;
  origin: string;
}

export interface OwnerState {
  status: "unclaimed" | "claimed";
  ownerId: string | null;
  discordUserId: string | null;
  passkeyCount: number;
}

export interface OwnerClaimInput {
  ownerId: string;
  discordUserId: string;
  bootstrapNonceAccepted: boolean;
}

export interface PasskeyLinkInput {
  sessionOwnerId: string | null;
  csrfToken: string;
  submittedCsrfToken: string;
  webauthnVerified: boolean;
}

const DISCORD_ID = /^\d{5,25}$/;

export function validateOwnerAuthConfig(config: OwnerAuthConfig): string[] {
  const errors: string[] = [];
  if (!DISCORD_ID.test(config.allowedDiscordUserId)) errors.push("allowedDiscordUserId");
  const rpId = config.rpId.trim().toLowerCase();
  if (!/^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/.test(rpId) || rpId.includes("..")) errors.push("rpId");
  try {
    const origin = new URL(config.origin);
    const localOrigin = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
    if ((!localOrigin && origin.protocol !== "https:") || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || origin.hostname.toLowerCase() !== rpId) errors.push("origin");
  } catch {
    errors.push("origin");
  }
  return errors;
}

export function isAllowedDiscordUser(config: OwnerAuthConfig, discordUserId: string): boolean {
  return DISCORD_ID.test(discordUserId) && discordUserId === config.allowedDiscordUserId;
}

export function claimInitialOwner(state: OwnerState, config: OwnerAuthConfig, input: OwnerClaimInput): OwnerState | null {
  if (state.status !== "unclaimed" || state.ownerId !== null || !input.bootstrapNonceAccepted) return null;
  if (!input.ownerId || !isAllowedDiscordUser(config, input.discordUserId)) return null;
  return { status: "claimed", ownerId: input.ownerId, discordUserId: input.discordUserId, passkeyCount: 0 };
}

export function canLinkPasskey(state: OwnerState, input: PasskeyLinkInput): boolean {
  if (state.status !== "claimed" || !state.ownerId || input.sessionOwnerId !== state.ownerId || !input.webauthnVerified) return false;
  return constantTimeEqual(input.csrfToken, input.submittedCsrfToken);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}
