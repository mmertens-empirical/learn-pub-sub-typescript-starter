# Implementation Plan - War Logic & Requeue Hell

## Goal Description

Implement the "War" mechanic in Peril.

- When a move results in `MakeWar`:
  - Publish a `RecognitionOfWar` message to routing key `war.<username>`.
  - **NackRequeue** the move message (to simulate the "requeue hell" / infinite
    retry until the war is resolved).
- Implement a `war` queue consumer:
  - Shared durable queue named `war`.
  - Routing key `war.*`.
  - Logic:
    - `NotInvolved`: **NackRequeue** (let someone else handle it).
    - `NoUnits`: **NackDiscard** (invalid state).
    - `YouWon`, `OpponentWon`, `Draw`: **Ack** (war over).
    - Error: **NackDiscard**.

## Proposed Changes

### Client Logic

#### [MODIFY] [src/client/index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Import `WarRecognitionsPrefix` and `handleWar`, `WarOutcome`.
- Update `subscribeJSON` for `army_moves.*`:
  - In handler:
    - If `MoveOutcome.MakeWar`:
      - Construct `RecognitionOfWar` object.
      - Publish to `ExchangePerilTopic` with key
        `${WarRecognitionsPrefix}.${username}`.
      - Return `"nack_requeue"`.
- Add new `subscribeJSON` for `war` queue:
  - Queue Name: `war` (shared, durable).
  - Routing Key: `war.*`.
  - Handler:
    - Call `handleWar(gs, data)`.
    - Switch on result:
      - `NotInvolved` -> Return `"nack_requeue"`.
      - `NoUnits` -> Return `"nack_discard"`.
      - `OpponentWon`, `YouWon`, `Draw` -> Return `"ack"`.
    - Catch/Default -> Return `"nack_discard"`.

## Verification Plan

### Manual Verification

1. Start `washington` and `napoleon`.
2. `washington`: `spawn americas infantry`.
3. `napoleon`: `spawn europe cavalry`.
4. `washington`: `move europe 1`.
5. **Observe**:
   - Washington's client should log "MakeWar", publish war message, then
     NackRequeue.
   - War consumer (on both clients) will pick up the war message.
   - If client is not involved, it NackRequeues.
   - Eventually the correct clients process it and one wins/loses.
   - RabbitMQ UI should show high redelivery count/message rate ("Requeue Hell")
     due to the loop until resolution.

### Automated Verification

- `GET /api/queues/%2F/war`
- Expect `message_stats.redeliver` > 100.
