# Implementation Plan - Durable Queues

## Goal Description

Implement durable queues that are automatically deleted when not in use. This
involves updating the `declareAndBind` helper to support the changed
requirements for "durable" queues and binding a `game_logs` queue in the server.

## User Review Required

> [!IMPORTANT]
> The requirements for "durable" queues have changed. Previously, they were
> `autoDelete: false`. Now, they must be "deleted automatically when they are no
> longer in use" (`autoDelete: true`). I will update `declareAndBind` to reflect
> this.

## Proposed Changes

### Shared Library

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Update `SimpleQueueType` logic in `declareAndBind`:
  - `durable`: `durable: true`, `autoDelete: true` (Changed from false),
    `exclusive: false`.
  - `transient`: `durable: false`, `autoDelete: true`, `exclusive: true`.

### Server

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/server/index.ts)

- Import `ExchangePerilTopic`, `GameLogSlug`.
- Call `declareAndBind` to create:
  - Exchange: `ExchangePerilTopic`
  - Queue Name: `GameLogSlug` ("game_logs")
  - Routing Key: `game_logs.*`
  - Type: `"durable"`

## Verification Plan

### Automated Verification

- Restart server: `npm run server`.
- Run CLI tests (provided by user, presumably externally or via `curl`
  equivalents).
- Verify queue properties via API:
  - `GET /api/queues/%2F/game_logs`
  - Expect: `durable: true`, `auto_delete: true`, `exclusive: false`.
