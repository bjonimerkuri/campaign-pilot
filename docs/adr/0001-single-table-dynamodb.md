# 1. Single-table DynamoDB design with tenant-scoped keys

Status: accepted

## Context

The service is multi-tenant and every read is naturally scoped to one tenant. Access patterns are small and known up front: look up a tenant by API key, create a campaign, get a campaign by id, list the latest campaigns of a tenant.

## Decision

Use one DynamoDB table with a generic `pk` / `sk` key.

| Entity | pk | sk |
| --- | --- | --- |
| API key | `APIKEY#<sha256>` | `TENANT` |
| Campaign | `TENANT#<tenantId>` | `CAMPAIGN#<timestamp>-<suffix>` |

Campaign ids start with a millisecond timestamp, so a reverse query on the tenant partition returns the newest campaigns first without an index.

## Consequences

- Every campaign key contains the tenant id, so a handler physically cannot read another tenant's item unless it builds a key with another tenant's id. The tenant id only comes from the authorizer context.
- No scans and no secondary indexes are needed for the current access patterns.
- A very large tenant creates a hot partition. If that ever matters, shard the partition key by tenant and month.
- New access patterns (search by status, for example) need a GSI and a deliberate design step.
