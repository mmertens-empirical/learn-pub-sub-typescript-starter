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
