import type {
  ConfirmChannel,
  Channel,
  Replies,
  Connection,
  ChannelModel,
} from "amqplib";
import { encode } from "@msgpack/msgpack";

export type SimpleQueueType = "durable" | "transient";

export async function declareAndBind(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
): Promise<[Channel, Replies.AssertQueue]> {
  let ch = await conn.createChannel();
  // Prevent crash on channel close error
  ch.on("error", () => {});

  let queue: Replies.AssertQueue;

  try {
    queue = await ch.assertQueue(queueName, {
      durable: queueType === "durable",
      autoDelete: queueType === "transient",
      exclusive: queueType === "transient",
      arguments: {
        "x-dead-letter-exchange": "peril_dlx",
      },
    });
  } catch (err: any) {
    console.log("Caught error declaring queue:", err);
    console.log("Error code:", err.code);
    if (
      err.code === 406 ||
      (err.message && err.message.includes("PRECONDITION_FAILED"))
    ) {
      // Re-create channel because the previous one is closed by the error
      ch = await conn.createChannel();
      await ch.deleteQueue(queueName);
      queue = await ch.assertQueue(queueName, {
        durable: queueType === "durable",
        autoDelete: queueType === "transient",
        exclusive: queueType === "transient",
        arguments: {
          "x-dead-letter-exchange": "peril_dlx",
        },
      });
    } else {
      throw err;
    }
  }

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

export async function publishMsgPack<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const data = encode(value);
  ch.publish(exchange, routingKey, Buffer.from(data), {
    contentType: "application/x-msgpack",
  });
}

export type AckType = "ack" | "nack_requeue" | "nack_discard";

export * from "./consume.js";
