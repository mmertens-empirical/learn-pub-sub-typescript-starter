import amqp from "amqplib";

async function main() {
  console.log("Starting Peril server...");
  const connStr = "amqp://guest:guest@localhost:5672/";
  const rabConn = await amqp.connect(connStr);
  console.log("Connection to RabbitMQ successful.");

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
