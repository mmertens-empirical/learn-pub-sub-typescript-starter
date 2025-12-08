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
