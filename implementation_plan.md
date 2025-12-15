# Implementation Plan - Game Logs

## Goal Description

Implement logging for Game Events (specifically War) using MessagePack and a
RabbitMQ topic exchange. Logs will be published to `game_logs` queue via
`peril_topic` exchange.

## Proposed Changes

### Game Logic

#### [MODIFY] [src/internal/gamelogic/logs.ts](file:///home/mmertens/bootdev/pubSub/src/internal/gamelogic/logs.ts)

- Update `GameLog` interface to match assignment:
  - `username`: string
  - `message`: string
  - `timestamp`: number (milliseconds) - _Note: current file has
    `currentTime: Date`, will likely add a new interface or update existing if
    unused elsewhere._

### Client Logic

#### [MODIFY] [src/client/index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Implement `publishGameLog(ch, username, message)`:
  - Create `GameLog` object.
  - Call `publishMsgPack` with routing key `GameLogSlug.username`.
- Update `war` queue handler:
  - On outcomes (`OpponentWon`, `YouWon`, `Draw`):
    - Construct log message (e.g., "{winner} won a war against {loser}").
    - Call `publishGameLog`.
    - Ack/Nack based on publishing success (try/catch).

### PubSub Library

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Remove `console.log("Ack")`, `console.log("Nack...")` from `subscribeJSON` as
  requested to clean up output.

## Verification Plan

### Manual Verification

1. Start server and 2 clients.
2. Spawn units and trigger war.
3. Check RabbitMQ UI/API for `game_logs` queue.
4. Expect `messages_ready > 0`.

### Automated Verification

- `GET /api/queues/%2F/game_logs`
- Expect `messages_ready > 2` (after 3 events).
