# Implementation Plan - Exchanges and Queues

## Goal Description

Implement message publishing in the server using a reusable `publishJSON` helper
function. This involves creating a confirm channel, defining the helper, and
publishing a "pause" message to the `peril_direct` exchange.

## User Review Required

> [!IMPORTANT]
> The instructions mention manually creating the exchange via the RabbitMQ
> Management UI. I will attempt to do this via the RabbitMQ HTTP API using
> `curl` to automate the process and ensure the server doesn't crash on startup.

## Proposed Changes

### Shared Library

#### [NEW] [index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Create `src/internal/pubsub` directory.
- Create an exported `publishJSON` function in `src/internal/pubsub` (will use
  `index.ts` as standard entry point since only directory was specified).

### Server

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/server/index.ts)

- Create a `ConfirmChannel`.
- Use `publishJSON` to send a `PlayingState` with `isPaused: true` to
  `ExchangePerilDirect`.

## Verification Plan

### Automated Tests

- Run `npm run rabbit:start` to ensure RabbitMQ is up.
- Use `curl` to check if the exchange exists and create it if missing.
- Run `npm run server` and check for errors.
- Verify using the provided HTTP API checks:
  - `curl -u guest:guest http://localhost:15672/api/exchanges/%2F/peril_direct`
    (Expect 200, type=direct)
  - `curl -u guest:guest http://localhost:15672/api/overview` (Check
    publish/drop stats)
