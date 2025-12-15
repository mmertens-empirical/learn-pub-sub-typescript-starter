# Implementation Plan - MessagePack Serialization

## Goal Description

Implement MessagePack serialization for message publishing. JSON is
human-readable but less efficient. MessagePack is binary and compact. We will
add a helper function `publishMsgPack` to serialize data using MessagePack
before publishing to RabbitMQ.

## Proposed Changes

### PubSub Library

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Import `encode` from `@msgpack/msgpack`.
- Export function `publishMsgPack<T>`:
  - Signature:
    `(ch: ConfirmChannel, exchange: string, routingKey: string, value: T): Promise<void>`
  - Logic:
    - `encode(value)` to get binary data.
    - `ch.publish(exchange, routingKey, Buffer.from(encodedData), { contentType: "application/x-msgpack" })`
    - Note: `encode` returns a `Uint8Array`, which might need conversion to
      `Buffer` for amqplib, or amqplib might accept it. `Buffer.from()` is safe.

## Verification Plan

- The user hasn't asked for a specific test case (e.g., "update client to use
  it").
- I will verify the code compiles (`npm run server` check).
- No runtime verification requested yet (likely next step).
