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
