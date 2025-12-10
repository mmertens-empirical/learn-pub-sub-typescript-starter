# Implementation Plan - Dead Letter

## Goal Description

Implement a Dead Letter exchange and queue system to capture failed messages. We
need to create:

- Exchange: `peril_dlx` (type: `fanout`)
- Queue: `peril_dlq` (default settings)
- Binding: `peril_dlq` -> `peril_dlx`

## User Review Required

> [!NOTE]
> The instructions specify "Using the UI" to create these resources. I will
> perform these actions programmatically using the RabbitMQ Management API
> (`curl`) to ensure exact reproduction and verification, as I cannot manipulate
> the browser UI directly.

## Proposed Changes

No code changes are required for this step. This is an infrastructure
configuration step.

### Infrastructure (RabbitMQ API)

1. **Create Exchange**
   - Name: `peril_dlx`
   - Type: `fanout`
   - Durable: `true` (Default)
2. **Create Queue**
   - Name: `peril_dlq`
   - Durable: `true` (Default)
3. **Create Binding**
   - Source: `peril_dlx`
   - Destination: `peril_dlq`
   - Routing Key: `` (empty)

## Verification Plan

### Automated Verification

- `GET /api/bindings`
- Verify response contains `peril_dlx` and `peril_dlq` binding.
