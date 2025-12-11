import type {
  ConfirmChannel,
  Channel,
  Replies,
  Connection,
  ChannelModel,
} from "amqplib";

export type SimpleQueueType = "durable" | "transient";

export async function declareAndBind(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
): Promise<[Channel, Replies.AssertQueue]> {
  const ch = await conn.createChannel();

  const queue = await ch.assertQueue(queueName, {
    durable: queueType === "durable",
    autoDelete: queueType === "transient",
    exclusive: queueType === "transient",
    arguments: {
      "x-dead-letter-exchange": "peril_dlx",
    },
  });

  await ch.bindQueue(queue.queue, exchange, routingKey);

  return [ch, queue];
}

export function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(value)),
      {
        contentType: "application/json",
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
}

export type AckType = "ack" | "nack_requeue" | "nack_discard";

export async function subscribeJSON<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    routingKey,
    queueType,
  );

  await ch.consume(queue.queue, async (msg) => {
    if (!msg) {
      console.warn("Consumer cancelled by server");
      return;
    }

    try {
      const data = JSON.parse(msg.content.toString()) as T;
      const ackType = await handler(data);

      switch (ackType) {
        case "ack":
          ch.ack(msg);
          console.log("Ack");
          break;
        case "nack_requeue":
          ch.nack(msg, false, true);
          console.log("NackRequeue");
          break;
        case "nack_discard":
          ch.nack(msg, false, false);
          console.log("NackDiscard");
          break;
      }
    } catch (err) {
      console.error("Error parsing/handling message:", err);
      // Depending on requirements, we might want to nack or just log.
      // For this exercise, logging is safe. Acking to prevent redelivery loops of bad data?
      // Instructions say "Acknowledge the message... to remove it".
      // Assuming valid JSON for now, but safer to ack even on error to unblock?
      // Actually, standard practice: if format error, ack/discard. If processing logic error, nack/requeue (maybe).
      // Let's stick to the happy path described: parse -> handler -> ack.
      // I'll leave the catch block but we should probably ack bad JSON too to clear it.
      // ch.ack(msg); // Defaulting to ack on error/crash inside handler might be unsafe if handler wanted nack.
      // But strictly following prompt: "If the subscriber crashes or fails to process the message... discard it"
      // So maybe NackDiscard is appropriate on error?
      // Or just NackDiscard logic is inside handler. If JSON parse fails, we can't call handler.
      // I'll nack_discard on parse error.
      ch.nack(msg, false, false);
    }
  });
}
