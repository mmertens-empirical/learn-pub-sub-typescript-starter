import amqp from "amqplib";
import {
  clientWelcome,
  getInput,
  printClientHelp,
  printQuit,
  commandStatus,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, publishJSON } from "../internal/pubsub/index.js";
import {
  ExchangePerilDirect,
  PauseKey,
  ExchangePerilTopic,
  ArmyMovesPrefix,
} from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove, handleMove } from "../internal/gamelogic/move.js";

import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { subscribeJSON } from "../internal/pubsub/index.js";
import type { ArmyMove } from "../internal/gamelogic/gamedata.js";

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
    (data: ArmyMove) => {
      handleMove(gs, data);
      process.stdout.write("> ");
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
  return (ps: PlayingState) => {
    if (ps.isPaused) {
      gs.pauseGame();
      console.log("The game is paused");
    } else {
      gs.resumeGame();
      console.log("The game is resumed");
    }
    process.stdout.write("> ");
  };
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
