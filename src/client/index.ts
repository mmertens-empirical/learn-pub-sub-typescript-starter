import amqp from "amqplib";
import {
  clientWelcome,
  getInput,
  printClientHelp,
  printQuit,
  commandStatus,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, publishJSON } from "../internal/pubsub/index.js";

import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { subscribeJSON } from "../internal/pubsub/index.js";

import {
  ExchangePerilDirect,
  PauseKey,
  ExchangePerilTopic,
  ArmyMovesPrefix,
  WarRecognitionsPrefix,
} from "../internal/routing/routing.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";
import type {
  ArmyMove,
  RecognitionOfWar,
} from "../internal/gamelogic/gamedata.js";
import type { AckType } from "../internal/pubsub/index.js";

async function main() {
  console.log("Starting Peril client...");
  const connStr = "amqp://guest:guest@localhost:5672/";
  const rabConn = await amqp.connect(connStr);
  console.log("Connection to RabbitMQ successful.");

  const username = await clientWelcome();
  const queueName = `${PauseKey}.${username}`;
  const gs = new GameState(username);

  await subscribeJSON(
    rabConn,
    ExchangePerilDirect,
    queueName,
    PauseKey,
    "transient",
    handlerPause(gs),
  );

  await subscribeJSON(
    rabConn,
    ExchangePerilTopic,
    `${ArmyMovesPrefix}.${username}`,
    `${ArmyMovesPrefix}.*`,
    "transient",
    async (data: ArmyMove): Promise<AckType> => {
      const outcome = handleMove(gs, data);
      process.stdout.write("> ");

      switch (outcome) {
        case MoveOutcome.Safe:
          return "ack";
        case MoveOutcome.MakeWar: {
          const ch = await rabConn.createConfirmChannel();
          try {
            const warMsg: RecognitionOfWar = {
              attacker: data.player,
              defender: gs.getPlayerSnap(),
            };
            await publishJSON(
              ch,
              ExchangePerilTopic,
              `${WarRecognitionsPrefix}.${username}`,
              warMsg,
            );
            ch.close();
            return "ack";
          } catch (e) {
            ch.close();
            return "nack_requeue";
          }
        }
        case MoveOutcome.SamePlayer:
          return "nack_discard";
        default:
          return "nack_discard";
      }
    },
  );

  await subscribeJSON(
    rabConn,
    ExchangePerilTopic,
    "war",
    `${WarRecognitionsPrefix}.*`,
    "durable",
    async (data: RecognitionOfWar): Promise<AckType> => {
      const outcome = handleWar(gs, data);
      process.stdout.write("> ");

      switch (outcome.result) {
        case WarOutcome.NotInvolved:
          return "nack_requeue";
        case WarOutcome.NoUnits:
          return "nack_discard";
        case WarOutcome.OpponentWon:
        case WarOutcome.YouWon:
        case WarOutcome.Draw:
          return "ack";
        default:
          return "nack_discard";
      }
    },
  );

  while (true) {
    const words = await getInput();
    if (words.length === 0) {
      continue;
    }

    const command = words[0];

    if (command === "spawn") {
      try {
        const unitId = await commandSpawn(gs, words);
        console.log(`Spawned unit with ID: ${unitId}`);
      } catch (e) {
        console.error(e);
      }
    } else if (command === "move") {
      try {
        const move = await commandMove(gs, words);
        await publishJSON(
          await rabConn.createConfirmChannel(),
          ExchangePerilTopic,
          `${ArmyMovesPrefix}.${username}`,
          move,
        );
        console.log("Move published successfully");
      } catch (e) {
        console.error(e);
      }
    } else if (command === "status") {
      await commandStatus(gs);
    } else if (command === "help") {
      printClientHelp();
    } else if (command === "spam") {
      console.log("Spamming not allowed yet!");
    } else if (command === "quit") {
      printQuit();
      process.exit(0);
    } else {
      console.error("Unknown command");
    }
  }
}

function handlerPause(gs: GameState) {
  return (ps: PlayingState): AckType => {
    if (ps.isPaused) {
      gs.pauseGame();
      console.log("The game is paused");
    } else {
      gs.resumeGame();
      console.log("The game is resumed");
    }
    process.stdout.write("> ");
    return "ack";
  };
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
