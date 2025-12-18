# Implementation Plan - Prefetch Update

## Goal Description

Update the prefetch count from 1 to 10 to improve message processing throughput
when running multiple server instances. Drain the backed-up `game_logs` queue.

## Proposed Changes

### PubSub Library

#### [MODIFY] [src/internal/pubsub/consume.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/consume.ts)

- Update `await ch.prefetch(1)` to `await ch.prefetch(10)` in the `subscribe`
  function.

## Verification Plan

### Manual Verification

1. Verify `game_logs` queue has messages.
2. Run `./src/scripts/multiserver.sh 20`.
3. Observe RabbitMQ Management UI:
   - Watch the "Acknowledge" rate (expected to be ~100 msg/s).
   - Watch "Ready" count drop to 0.
4. Once empty, terminate the script.

### Automated Tests

- Run `curl -u guest:guest http://localhost:15672/api/queues/%2F/game_logs` and
  verify `messages_ready == 0`.
