# Implementation Plan - Scaling Servers

## Goal Description

Scale the Peril server to 100 instances to attempt emptying the backed-up
`game_logs` queue and observe the limitations caused by current prefetch
settings.

## Proposed Changes

### Server Logic

#### [MODIFY] [src/server/index.ts](file:///home/mmertens/bootdev/pubSub/src/server/index.ts)

- Add a check for `process.stdin.isTTY` before the command loop.
- If not a TTY, print a message and exit the function early to allow the server
  to remain active as a background consumer without trying to read interactive
  input.

## Verification Plan

### Manual Verification

1. Verify `game_logs` queue has messages (it should from the previous task).
2. Run `./src/scripts/multiserver.sh 100`.
3. Observe RabbitMQ Management UI:
   - Check the number of consumers (should be 100+).
   - Watch the "Ready" vs "Unacknowledged" message counts.
   - Observe the "Acknowledge" rate (expected to be lower than theoretical 100
     msg/s if fixed prefetch is an issue).
4. Terminate the script with Ctrl+C.
