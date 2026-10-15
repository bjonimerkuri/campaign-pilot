# 2. Asynchronous copy generation through EventBridge

Status: accepted

## Context

LLM calls take seconds and can fail or be rate limited. Holding an API request open for that long couples client latency to a third-party service and wastes API Gateway and Lambda time.

## Decision

`POST /campaigns` stores the campaign as `PENDING`, publishes a `CampaignCreated` event and returns `202`. A separate worker Lambda subscribed through an EventBridge rule generates the copy and updates the campaign to `READY` or `FAILED`. Clients poll `GET /campaigns/{id}`.

The worker is idempotent: it only processes `PENDING` campaigns and finishes with a conditional update. The EventBridge target has a retry policy and an SQS dead-letter queue for events that cannot be delivered.

## Consequences

- Clients see fast responses and a clear status lifecycle.
- Generation failures are recorded on the campaign and surfaced through a log metric alarm, because the worker handles model errors without throwing.
- The write and the publish are two separate calls. If the publish fails after the write, the campaign stays `PENDING`. A transactional outbox (DynamoDB Streams to EventBridge Pipes) is the known fix and is listed in the roadmap.
