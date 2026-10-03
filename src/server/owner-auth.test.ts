import { describe, expect, it } from "vitest";
import { canLinkPasskey, claimInitialOwner, constantTimeEqual, validateOwnerAuthConfig, type OwnerState } from "./owner-auth";

const config = { allowedDiscordUserId: "123456789012345678", rpId: "tool.example", origin: "https://tool.example/" };
const unclaimed: OwnerState = { status: "unclaimed", ownerId: null, discordUserId: null, passkeyCount: 0 };

describe("owner authentication policy", () => {
  it("requires an exact Discord user ID and matching WebAuthn origin", () => {
    expect(validateOwnerAuthConfig(config)).toEqual([]);
    expect(validateOwnerAuthConfig({ ...config, origin: "https://other.example/" })).toContain("origin");
    expect(validateOwnerAuthConfig({ ...config, allowedDiscordUserId: "owner-name" })).toContain("allowedDiscordUserId");
    expect(claimInitialOwner(unclaimed, config, { ownerId: "session-owner", discordUserId: "123456789012345678", bootstrapNonceAccepted: true })).not.toBeNull();
    expect(claimInitialOwner(unclaimed, config, { ownerId: "attacker", discordUserId: "999999999999999999", bootstrapNonceAccepted: true })).toBeNull();
  });

  it("requires an accepted one-time bootstrap and prevents a second claimant", () => {
    expect(claimInitialOwner(unclaimed, config, { ownerId: "owner", discordUserId: config.allowedDiscordUserId, bootstrapNonceAccepted: false })).toBeNull();
    const claimed = claimInitialOwner(unclaimed, config, { ownerId: "owner", discordUserId: config.allowedDiscordUserId, bootstrapNonceAccepted: true });
    expect(claimed).not.toBeNull();
    expect(claimInitialOwner(claimed!, config, { ownerId: "other", discordUserId: config.allowedDiscordUserId, bootstrapNonceAccepted: true })).toBeNull();
  });

  it("links a passkey only for the owner with verified WebAuthn and CSRF", () => {
    const state: OwnerState = { status: "claimed", ownerId: "owner", discordUserId: config.allowedDiscordUserId, passkeyCount: 0 };
    expect(canLinkPasskey(state, { sessionOwnerId: "owner", csrfToken: "csrf", submittedCsrfToken: "csrf", webauthnVerified: true })).toBe(true);
    expect(canLinkPasskey(state, { sessionOwnerId: "attacker", csrfToken: "csrf", submittedCsrfToken: "csrf", webauthnVerified: true })).toBe(false);
    expect(canLinkPasskey(state, { sessionOwnerId: "owner", csrfToken: "csrf", submittedCsrfToken: "wrong", webauthnVerified: true })).toBe(false);
    expect(canLinkPasskey(state, { sessionOwnerId: "owner", csrfToken: "csrf", submittedCsrfToken: "csrf", webauthnVerified: false })).toBe(false);
  });

  it("compares opaque CSRF values without an early length return", () => {
    expect(constantTimeEqual("same", "same")).toBe(true);
    expect(constantTimeEqual("same", "same-x")).toBe(false);
    expect(constantTimeEqual("same", "different")).toBe(false);
  });
});
