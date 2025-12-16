import amqp from "amqplib";
import {
  ExchangePerilDirect,
  PauseKey,
  ExchangePerilTopic,
  GameLogSlug,
} from "../internal/routing/routing.js";
import {
  publishJSON,
  subscribeMsgPack,
  type AckType,
} from "../internal/pubsub/index.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { writeLog, type GameLog } from "../internal/gamelogic/logs.js";

async function main() {
  console.log("Starting Peril server...");
  const connStr = "amqp://guest:guest@localhost:5672/";
  const rabConn = await amqp.connect(connStr);
  console.log("Connection to RabbitMQ successful.");

  const ch = await rabConn.createConfirmChannel();

  await subscribeMsgPack(
    rabConn,
    ExchangePerilTopic,
    GameLogSlug,
    "game_logs.*",
    "durable",
    async (log: GameLog): Promise<AckType> => {
      await writeLog(log);
      process.stdout.write("> ");
      return "ack";
    },
  );

  printServerHelp();

  while (true) {
    const words = await getInput();
    if (words.length === 0) {
      continue;
    }

    const command = words[0];

    if (command === "pause") {
      console.log("Pausing game...");
      const playingState: PlayingState = {
        isPaused: true,
      };
      await publishJSON(ch, ExchangePerilDirect, PauseKey, playingState);
    } else if (command === "resume") {
      console.log("Resuming game...");
      const playingState: PlayingState = {
        isPaused: false,
      };
      await publishJSON(ch, ExchangePerilDirect, PauseKey, playingState);
    } else if (command === "quit") {
      console.log("Program is shutting down...");
      await rabConn.close();
      console.log("Connection closed.");
      process.exit(0);
    } else {
      console.log("Unknown command. Type 'help' for possible commands.");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
