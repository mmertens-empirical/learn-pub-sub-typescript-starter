# Implementation Plan - Transient Queues

## Goal Description

Implement automatic queue creation in the client. We will create a
`declareAndBind` helper function that handles both durable and transient queues,
and update the client to create a transient queue for receiving pause messages.

## User Review Required

> [!NOTE]
> I will define `SimpleQueueType` as a string union type
> `'durable' | 'transient'` in `src/internal/pubsub/index.ts`.

## Proposed Changes

### Shared Library

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Export `SimpleQueueType` type.
- Implement `declareAndBind` function:
  - Accepts connection, exchange, queue name, routing key, and queue type.
  - Creates a channel.
  - Asserts queue with appropriate flags (durable vs transient).
  - Binds queue to exchange.
  - Returns channel and queue assertion.

### Client

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Connect to RabbitMQ.
- Use `clientWelcome` to get username.
- Call `declareAndBind` to create a transient queue named `pause.<username>`.

## Verification Plan

### Manual Verification

- Run `npm run client`, enter username `suntzu`.
- Keep client running.

### Automated Verification

- While client is running, use `curl` to check queue properties:
  - `GET /api/queues/%2F/pause.suntzu`
  - Verify `auto_delete: true`, `exclusive: true`, `durable: false`.
