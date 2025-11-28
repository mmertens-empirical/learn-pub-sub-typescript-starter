import amqp from "amqplib";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { publishJSON } from "../internal/pubsub/index.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";

async function main() {
  console.log("Starting Peril server...");
  const connStr = "amqp://guest:guest@localhost:5672/";
  const rabConn = await amqp.connect(connStr);
  console.log("Connection to RabbitMQ successful.");

  const ch = await rabConn.createConfirmChannel();

  const playingState: PlayingState = {
    isPaused: true,
  };

  await publishJSON(ch, ExchangePerilDirect, PauseKey, playingState);

  process.on("SIGINT", async () => {
    console.log("\nProgram is shutting down...");
    await rabConn.close();
    console.log("Connection closed.");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
