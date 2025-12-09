# Implementation Plan - Routing Patterns

## Goal Description

Implement move broadcasting. When a player moves, the move is published to
`army_moves.<username>` on the `peril_topic` exchange. All clients subscribe to
`army_moves.*` to receive updates.

## User Review Required

> [!NOTE]
> I will specifically use `commandMove` to validate and generate the move
> object, but instead of just applying it locally, I will publish it. However,
> since the instruction says "The handler for new messages should use the
> handleMove function", and previously `commandMove` _returned_ an `ArmyMove`, I
> will modify the flow:
>
> 1. Call `commandMove` (which seemingly updates state and returns move).
> 2. Publish `ArmyMove` returned by `commandMove`.
> 3. `handleMove` in the subscriber logs the move. It _checks_ for war but
>    doesn't seem to _apply_ the move to the local state snap (except it logs
>    it). Wait, `handleMove` in `move.ts` does NOT update `GameState`. It just
>    logs.
> 4. `commandMove` _updates_ `GameState` (lines 90-91 of `move.ts`).
> 5. So: Publisher (local client) updates state and publishes. Subscriber (other
>    clients) just logs via `handleMove`. This seems correct based on available
>    code.

## Proposed Changes

### Client

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Import `handleMove` from `move.ts`.
- Import `ArmyMovesPrefix`, `ExchangePerilTopic` from `routing.ts`.
- Import `publishJSON`.
- In `main`:
  - Call `subscribeJSON`:
    - Exchange: `ExchangePerilTopic`
    - Queue: `army_moves.<username>`
    - Key: `army_moves.*`
    - Type: `transient`
    - Handler:
      `(data: ArmyMove) => { handleMove(gs, data); process.stdout.write("> "); }`
  - In `move` command block:
    - Get `move` object from `commandMove(gs, words)`.
    - Publish `move` object to `ExchangePerilTopic` with key
      `${ArmyMovesPrefix}.${username}`.
    - Log "Move published successfully".

## Verification Plan

### Manual Verification

1. Start 2 clients: `washington` and `napoleon`.
2. `washington`: `spawn americas infantry`.
3. `washington`: `move asia 1`.
4. Verify `napoleon` logs "washington is moving...".
5. Verify `washington` also logs it (since it subscribed to `army_moves.*` and
   topic exchange reflects to all matching queues).

### Automated Verification

- `GET /api/bindings`
- Expect body to contain `army_moves.*`.
