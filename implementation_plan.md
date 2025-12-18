# Implementation Plan - Consume Logs

## Goal Description

Implement consumption of Game Logs on the server side and save them to disk.
Refactor `pubsub` module to separate consumption logic into `consume.ts`. Use
MessagePack for log deserialization.

## Proposed Changes

### Configuration

#### [MODIFY] [.gitignore](file:///home/mmertens/bootdev/pubSub/.gitignore)

- Add `*.log` to ignore log files.

### PubSub Library

#### [NEW] [src/internal/pubsub/consume.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/consume.ts)

- Implement generic `subscribe<T>` function (as provided in prompt).
- Implement `subscribeMsgPack<T>`:
  - Uses `decode` from `@msgpack/msgpack`.
  - Calls `subscribe` with `unmarshaller` = `decode`.
- Move/Refactor `subscribeJSON<T>`:
  - Calls `subscribe` with `unmarshaller` = `JSON.parse`.

#### [MODIFY] [src/internal/pubsub/index.ts](file:///home/mmertens/bootdev/pubSub/src/internal/pubsub/index.ts)

- Remove `subscribeJSON` implementation (it moved to `consume.ts`).
- Export everything from `consume.ts`.

### Server Logic

#### [MODIFY] [src/server/index.ts](file:///home/mmertens/bootdev/pubSub/src/server/index.ts)

- Import `subscribeMsgPack`.
- Import `writeLog` from `gamelogic/logs.js`.
- Replace `declareAndBind` for `game_logs` with `subscribeMsgPack`:
  - Routing Key: `GameLogSlug.*` (Wildcard).
  - Handler:
    - Call `writeLog(log)`.
    - Print prompt (`>`).
    - Return `ack`.

## Verification Plan

### Manual Verification

1. Restart Server.
2. Observe `game.log` file creation and content (expect 3+ logs from previous
   step).
3. Check RabbitMQ API: `messages_ready` should be 0.

### Automated Verification

- `GET /api/queues/%2F/game_logs` -> Expect 0 messages ready.
