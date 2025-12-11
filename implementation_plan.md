# Implementation Plan - Dead Letter Queue Configuration

## Goal Description

Configure all queues to route failed (nacked) messages to the `peril_dlx` dead
letter exchange.

- Update `declareAndBind` to include `x-dead-letter-exchange` in queue
  arguments.
- Verify that when a client NackDiscards a message, it ends up in the
  `peril_dlq`.

## Proposed Changes

### Queue Configuration

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- In `declareAndBind`:
  - Add `arguments` to `ch.assertQueue`.
  - Set `x-dead-letter-exchange` to `"peril_dlx"`.

## Verification Plan

### Manual Verification

1. Stop/Restart 2 clients: `washington`, `napoleon` (this recreates their
   transient queues).
2. `washington`: `spawn americas artillery`.
3. `napoleon`: `spawn europe cavalry`.
4. `washington`: `move europe 1`.
5. `washington` should log `NackDiscard`.
6. `napoleon` should log `Ack`.

### Automated Verification

- `GET /api/queues/%2F/peril_dlq`
- Expect `messages_ready` > 0.
