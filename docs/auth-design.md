# YokingTools owner authentication design

This document is an implementation plan and policy boundary. No Discord app grant, OAuth secret, passkey registration, domain, DNS, Access policy, or production session store is configured in this repository.

## One owner, two authenticators

- Discord OAuth identifies the owner by one exact, configured Discord user ID. Display names and email addresses are not authorization keys.
- WebAuthn passkeys are additional authenticators for the same owner record. They never create a second owner.
- Linking a passkey requires an already authenticated owner session, a verified WebAuthn assertion, an exact RP ID/origin binding, and a CSRF match.

## Bootstrap and recovery

1. The service starts unclaimed, with a server-only one-time bootstrap secret or an out-of-band owner enrollment action.
2. The first claim requires both that bootstrap proof and the exact configured Discord user ID.
3. The claim must be an atomic compare-and-set in Durable Objects or D1; an in-memory check is not sufficient against two simultaneous first visitors.
4. Recovery is an owner-only, single-use flow. It must not silently re-open first registration. Recovery codes are stored hashed and rotated after use.

## Browser and session controls

- OAuth uses state and PKCE; callback state is single-use and bound to the initiating browser session.
- Sessions are opaque, server-side, short-lived, rotated after login/linking, and sent only in `HttpOnly; Secure; SameSite=Lax` cookies.
- State-changing requests require a separate CSRF token. The policy helper compares it without an early length return.
- WebAuthn challenges are single-use, short-lived, and stored server-side. Production verification must check RP ID, origin, challenge, user handle, and signature counter/backup state.
- Missing or inconsistent auth configuration keeps management routes disabled (HTTP 503).

## OSS and secret separation

The repository is intended to be publishable without credentials or personal account identifiers. Use environment bindings/secrets for the Discord owner ID, client credentials, RP ID/origin, bootstrap material, session signing, and storage bindings. Keep `.env` and `.dev.vars` local; `.env.example` contains names only. License choice and public publication remain undecided.
