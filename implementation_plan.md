# Implementation Plan - Backpressure Demonstration

## Goal Description

Demonstrate backpressure by:

1. Limiting the server to process only one message at a time.
2. Generating a large spike of messages from the client.

## Proposed Changes

### PubSub Library

#### [MODIFY] [src/internal/pubsub/consume.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/consume.ts)

- In the `subscribe` function, add `await ch.prefetch(1)` after the queue is
  declared and bound. This ensures the consumer only receives one message at a
  time.

### Client Logic

#### [MODIFY] [src/client/index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Update the `spam` command handler:
  - Parse the number of messages to spam from `words[1]`.
  - Loop `n` times.
  - Call `getMaliciousLog()` to get a message.
  - Call `publishMsgPack()` to send the message to the `peril_topic` exchange
    with routing key `game_logs.<username>`.

## Verification Plan

### Manual Verification

1. Start the server and client.
2. Run `spam 25` in the client.
3. Observe the server processing messages slowly (1 per second due to the
   `block` in `writeLog`).
4. Observe the queue in RabbitMQ Management UI growing and then shrinking.
5. Run `spam 10000` to create a sustained backpressure scenario.

### Automated Tests

- Run `curl -u guest:guest http://localhost:15672/api/queues/%2F/game_logs` and
  verify `messages_ready > 999`.
