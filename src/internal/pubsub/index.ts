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

export async function subscribeJSON<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    routingKey,
    queueType,
  );

  await ch.consume(queue.queue, (msg) => {
    if (!msg) {
      console.warn("Consumer cancelled by server");
      return;
    }

    try {
      const data = JSON.parse(msg.content.toString()) as T;
      handler(data);
      ch.ack(msg);
    } catch (err) {
      console.error("Error parsing/handling message:", err);
      // Depending on requirements, we might want to nack or just log.
      // For this exercise, logging is safe. Acking to prevent redelivery loops of bad data?
      // Instructions say "Acknowledge the message... to remove it".
      // Assuming valid JSON for now, but safer to ack even on error to unblock?
      // Actually, standard practice: if format error, ack/discard. If processing logic error, nack/requeue (maybe).
      // Let's stick to the happy path described: parse -> handler -> ack.
      // I'll leave the catch block but we should probably ack bad JSON too to clear it.
      ch.ack(msg);
    }
  });
}
