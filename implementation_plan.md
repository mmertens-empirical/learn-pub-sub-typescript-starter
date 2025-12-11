# Implementation Plan - Ack and Nack

## Goal Description

Implement proper message acknowledgement (Ack) and negative acknowledgement
(Nack) handling.

- `subscribeJSON` handlers must return an `AckType` (`Ack`, `NackRequeue`,
  `NackDiscard`).
- Based on `AckType`, the consumer will inspect the message and call `ack`,
  `nack(msg, false, true)`, or `nack(msg, false, false)`.
- Client handlers must receive validation logic to determine whether to Ack or
  NackDiscard.

## Proposed Changes

### Queue/Exchange Management

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Define `AckType` type/enum: "ack", "nack_requeue", "nack_discard".
- Update `subscribeJSON` signature: `handler` returns `Promise<AckType>` or
  `AckType`.
- In `subscribeJSON` `consume` callback:
  - Receive `AckType` from handler.
  - Switch on `AckType`:
    - `Ack`: `ch.ack(msg)` + log "Ack"
    - `NackRequeue`: `ch.nack(msg, false, true)` + log "NackRequeue"
    - `NackDiscard`: `ch.nack(msg, false, false)` + log "NackDiscard"

### Client Logic

#### [MODIFY] [src/client/index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Update `handlerPause`: Return `Ack` (always).
- Update subscription to `army_moves.*`:
  - Call `handleMove`.
  - Check outcome (`MoveOutcome`):
    - `SamePlayer`, `MakeWar`, `Safe`.
  - Logic:
    - `MakeWar` OR `Safe` -> `Ack`
    - `SamePlayer` -> `NackDiscard` (Wait, instructions say: "The 'move' handler
      should 'NackDiscard' if: The move outcome was 'same player' Or... anything
      else")
    - Other -> `NackDiscard`

## Verification Plan

### Manual Verification

1. Start 2 clients: `washington`, `napoleon`.
2. `washington`: `spawn americas artillery`.
3. `napoleon`: `spawn europe cavalry`.
4. `washington`: `move europe 1`.
5. Expected Logs:
   - `napoleon`: "Move Detected" -> "Ack" (Because it's `MakeWar` or `Safe` -
     "Safe" or "War" depending on overlap? Overlap is checked. If invalid move,
     it's discarded? Instructions say "SamePlayer" is Discard.)
   - `washington`: "Move Detected" -> "SamePlayer" -> "NackDiscard"
