import amqp from "amqplib";
import {
  clientWelcome,
  getInput,
  printClientHelp,
  printQuit,
  commandStatus,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/index.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

async function main() {
  console.log("Starting Peril client...");
  const connStr = "amqp://guest:guest@localhost:5672/";
  const rabConn = await amqp.connect(connStr);
  console.log("Connection to RabbitMQ successful.");

  const username = await clientWelcome();
  const queueName = `${PauseKey}.${username}`;

  await declareAndBind(
    rabConn,
    ExchangePerilDirect,
    queueName,
    PauseKey,
    "transient",
  );

  const gs = new GameState(username);

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
        await commandMove(gs, words);
        console.log("Move successful");
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

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
