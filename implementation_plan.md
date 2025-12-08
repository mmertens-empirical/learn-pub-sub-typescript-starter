# Implementation Plan - Consumers

## Goal Description

Implement message consumption in the client to react to pause/resume events.
This involves creating a generic `subscribeJSON` helper and a specific handler
for pause messages in the client.

## User Review Required

> [!NOTE]
> I will use `amqp.ConsumeMessage` type for the callback.

## Proposed Changes

### Shared Library

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Export `subscribeJSON` function:
  - calls `declareAndBind`.
  - calls `ch.consume`.
  - parses JSON from `msg.content`.
  - calls handler.
  - acks message.

### Client

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Implement `handlerPause(gs: GameState)`:
  - Returns a function `(ps: PlayingState) => void`.
  - Calls `gs.handlePause` (need to check if this exists or if I need to
    implement logic, instructions say "Use game state handlePause function").
    _Wait, looking at `gamestate.ts` earlier, it has `pauseGame()` and
    `resumeGame()`, not `handlePause`. I might need to clarify or adapt._ Use
    `gs.pauseGame()` if `ps.isPaused` is true, and `gs.resumeGame()` otherwise.
  - Prints "> " for UI refresh.
- Update `main`:
  - Call `subscribeJSON` with `handlerPause(gs)`.

## Verification Plan

### Manual Verification

1. Start client (`washington`) and server.
2. Spawn unit in client.
3. Pause game in server.
4. Verify client logs "The game is paused" (or similar from game state) and
   disallows move.
5. Resume game in server.
6. Verify client allows move.

### Automated Verification

- `GET /api/queues/%2F/pause.washington`
- Expect `message_stats.deliver_get > 1`.
