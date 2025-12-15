# Implementation Plan - Nack Requeue Fix

## Goal Description

Fix the "Requeue Hell" in the `move` handler.

- Instead of always returning `nack_requeue` when `MakeWar` occurs:
  - Attempt to publish the `RecognitionOfWar` message.
  - If successful: Return `"ack"` (Consumer successfully processed the move by
    starting the war).
  - If failure (publish error): Return `"nack_requeue"` (Transient error, try
    again).

## Proposed Changes

### Client Logic

#### [MODIFY] [src/client/index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- In the `army_moves` subscription handler (`MakeWar` case):
  - Wrap publication in `try/catch`.
  - If successful: `ch.close()` and return `"ack"`.
  - If catch error: `ch.close()` (safely) and return `"nack_requeue"`.

## Verification Plan

### Manual Verification

1. Start `washington` and `napoleon`.
2. `washington`: `spawn americas infantry`.
3. `napoleon`: `spawn europe cavalry`.
4. `washington`: `move europe 1`.
5. **Observe**:
   - War declaration logs appear **once**.
   - No infinite loop of "War Declared" / "Ack".
   - Washington logs "You have lost..." (or won) and then stops.

### Automated Verification

- No specific API stats to check other than observing normal behavior vs
  infinite loop.
