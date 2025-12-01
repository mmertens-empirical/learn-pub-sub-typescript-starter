# Implementation Plan - Client REPL

## Goal Description

Update the client to support interactive game commands via a REPL loop. This
allows players to spawn units, move them, and check their status.

## User Review Required

> [!NOTE]
> I will use the existing helper functions provided in
> `src/internal/gamelogic/`.

## Proposed Changes

### Client

#### [MODIFY] [index.ts](file:///home/mmertens/bootdev/pubSub/src/client/index.ts)

- Import `GameState`, `commandSpawn`, `commandMove`, `printClientHelp`,
  `printQuit`, `commandStatus`, `getInput`.
- Initialize `GameState` with the username after connection.
- Implement an infinite loop:
  - Wait for input using `getInput`.
  - Handle `spawn`: Call `commandSpawn`.
  - Handle `move`: Call `commandMove`.
  - Handle `status`: Call `commandStatus`.
  - Handle `help`: Call `printClientHelp`.
  - Handle `spam`: Print "Spamming not allowed yet!".
  - Handle `quit`: Call `printQuit` and exit.
  - Handle unknown commands: Print error.

## Verification Plan

### Manual Verification

1. Run `npm run client`.
2. Enter username (e.g., `suntzu`).
3. Test commands:
   - `help`
   - `spawn europe infantry` (Check output for ID)
   - `status` (Check if unit appears)
   - `move europe <ID>` (Move unit)
   - `spam`
   - `quit`
