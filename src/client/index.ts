import amqp from "amqplib";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/index.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

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
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
