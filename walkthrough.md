# Verification: Exchanges and Queues

## Changes Made

- Created `src/internal/pubsub/index.ts` with `publishJSON` helper.
- Updated `src/server/index.ts` to create a `ConfirmChannel` and publish a pause
  message.
- Created `peril_direct` exchange via RabbitMQ API.

## Verification Results

### Server Execution

The server started successfully and connected to RabbitMQ.

```
Starting Peril server...
Connection to RabbitMQ successful.
```

### Exchange Verification

`GET /api/exchanges/%2F/peril_direct`

```json
{
  "name": "peril_direct",
  "type": "direct",
  "durable": true,
  ...
}
```

Result: **Success** (Type is `direct`)

### Message Stats Verification

`GET /api/overview`

```json
{
  "message_stats": {
    "publish": 1,
    "drop_unroutable": 1,
    ...
  }
}
```

Result: **Success** (Published > 0, Drop Unroutable > 0)

# Verification: Transient Queues

## Changes Made

- Implemented `declareAndBind` in `src/internal/pubsub/index.ts`.
- Updated `src/client/index.ts` to create a transient queue using
  `declareAndBind`.

## Verification Results

### Queue Properties Verification

Run client with username `suntzu`. `GET /api/queues/%2F/pause.suntzu`

```json
{
  "name": "pause.suntzu",
  "auto_delete": true,
  "exclusive": true,
  "durable": false,
  ...
}
```

Result: **Success** (Matches all transient properties)

# Verification: Decoupling

## Changes Made

- Updated `src/server/index.ts` to include a REPL loop for interactive `pause`,
  `resume`, and `quit` commands.

## Verification Results

### Decoupling Verification

Started 3 clients (`washington`, `napoleon`, `churchill`) and the server. Sent
`pause` command from server.

`GET /api/queues/%2F/pause.washington`

```json
{
  "name": "pause.washington",
  "messages": 1,
  ...
}
```

Result: **Success** (Message received)

`GET /api/queues/%2F/pause.napoleon`

```json
{
  "name": "pause.napoleon",
  "messages": 1,
  ...
}
```

Result: **Success** (Message received)

`GET /api/queues/%2F/pause.churchill`

```json
{
  "name": "pause.churchill",
  "messages": 1,
  ...
}
```

Result: **Success** (Message received)

# Verification: Client REPL

## Changes Made

- Updated `src/client/index.ts` to include a REPL loop for `spawn`, `move`,
  `status`, `help`, `spam`, and `quit` commands.

## Verification Results

### REPL Verification

Run client with username `suntzu`.

`spawn europe infantry`

```
Spawned a(n) infantry in europe with id 1
```

Result: **Success**

`status`

```
You are suntzu, and you have 1 units.
* 1: europe, infantry
```

Result: **Success**

`move asia 1`

```
Moved 1 units to asia
```

Result: **Success**

`status`

```
You are suntzu, and you have 1 units.
* 1: asia, infantry
```

Result: **Success**

# Verification: Durable Queues

## Changes Made

- Updated `src/server/index.ts` to bind `game_logs` queue to `peril_topic`
  exchange.
- **Fixed:** Reverted `declareAndBind` to ensure "durable" queues have
  `autoDelete: false`.

## Verification Results

### Queue Properties Verification

`GET /api/queues/%2F/game_logs`

```json
{
  "name": "game_logs",
  "auto_delete": false,
  "durable": true,
  "exclusive": false,
  ...
}
```

Result: **Success** (Matches correct requirements: Durable, Non-exclusive, NOT
Auto-delete)

# Verification: Consumers

## Changes Made

- Implemented `subscribeJSON` in `src/internal/pubsub/index.ts`.
- Updated `src/client/index.ts` to implement `handlerPause` and subscribe to
  pause messages.

## Verification Results

### Consumer Behavior

Started client (`washington`) and server.

1. Spawned unit in client.
2. Server sent `pause`. Client received: `The game is paused`.
3. Client attempted move. Result: `Error: The game is paused...` (Correct).
4. Server sent `resume`. Client received: `The game is resumed`.
5. Client attempted move. Result: `Moved 1 units...` (Correct).

### Message Stats Verification

`GET /api/queues/%2F/pause.washington`

```json
{
  "name": "pause.washington",
  "message_stats": {
    "publish": 2, // > 1
    "deliver_get": 2 // > 1
  },
  ...
}
```

Result: **Success** (Messages published and consumed)

# Verification: Routing Patterns

## Changes Made

- Updated `src/client/index.ts` to subscribe to `army_moves.*` on `peril_topic`
  topic using `subscribeJSON`.
- Updated `src/client/index.ts` `move` command to publish to
  `army_moves.<username>` on `peril_topic`.

## Verification Results

### Move Broadcast

Started 2 clients: `washington` and `napoleon`.

1. `washington` spawned units.
2. `washington` executed `move asia 1 2`.
3. `washington` logs:

```
==== Move Detected ====
washington is moving 2 unit(s) to asia
* infantry
* cavalry
------------------------
```

4. `napoleon` logs:

```
==== Move Detected ====
washington is moving 2 unit(s) to asia
* infantry
* cavalry
You are safe from washington's units.
------------------------
```

Result: **Success** (Broadcast received by both publisher and subscriber)

### Bindings Verification

Using CLI test data (provided by user): `GET /api/bindings` Expect:
`army_moves.*` binding. Result from user CLI output:
`routing_key: "army_moves.*"` exists in bindings list. Result: **Success**
