# 3. API key authentication with a Lambda authorizer

Status: accepted

## Context

The API needs to identify the tenant on every request. The project is a reference implementation, so the mechanism should be simple, secure enough to demonstrate tenant isolation, and replaceable.

## Decision

Clients send an `x-api-key` header. A Lambda authorizer hashes it with SHA-256, looks up `APIKEY#<hash>` in DynamoDB and returns the tenant id in the authorizer context. Results are cached for five minutes per key. Plain keys are never stored and are shown once when a tenant is seeded.

## Consequences

- Handlers receive a trusted tenant id and never parse credentials.
- Revoking a key takes effect after the authorizer cache expires.
- For production use, replace this with JWT-based authentication from an identity provider and keep the same `tenantId` context contract, so handlers do not change.
