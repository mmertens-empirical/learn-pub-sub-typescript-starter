# Implementation Plan - Robust Queue Declaration

## Goal Description

Modify `declareAndBind` to handle `PRECONDITION_FAILED` errors caused by
conflicting queue arguments (e.g., mismatching `x-dead-letter-exchange`). The
system should automatically delete and recreate the queue in these cases to
ensure the latest configuration is applied without manual intervention.

## Proposed Changes

### Queue Declaration Logic

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Wrap `ch.assertQueue` in a `try/catch` block.
- Catch errors with code `406` (PRECONDITION_FAILED) or message containing
  "PRECONDITION_FAILED".
- If caught:
  1. Create a replacement channel (since the original is closed by the error).
  2. Delete the conflicting queue using `ch.deleteQueue`.
  3. Re-run `ch.assertQueue` with the correct arguments.
  4. Bind and return the new channel and queue.
- If other error, re-throw.

## Verification Plan

### Automated Verification

1. **Stop Server** (if running).
2. **Create Conflicting Queue**:
   - Use RabbitMQ API (`curl`) to delete `game_logs`.
   - Create `game_logs` _without_ `x-dead-letter-exchange` argument.
3. **Run Server**:
   - `npm run server`
   - Verify server starts successfully (no 406 crash).
   - Verify `game_logs` queue args via API (should have DLX).
