import type { ChannelModel } from "amqplib";
import { decode } from "@msgpack/msgpack";
import type { AckType, SimpleQueueType } from "./index.js";
import { declareAndBind } from "./index.js";

export async function subscribe<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  simpleQueueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
  unmarshaller: (data: Buffer) => T,
): Promise<void> {
  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    routingKey,
    simpleQueueType,
  );

  await ch.prefetch(1);

  await ch.consume(queue.queue, async (msg) => {
    if (!msg) {
      console.warn("Consumer cancelled by server");
      return;
    }

    try {
      const data = unmarshaller(msg.content);
      const ackType = await handler(data);

      switch (ackType) {
        case "ack":
          ch.ack(msg);
          break;
        case "nack_requeue":
          ch.nack(msg, false, true);
          break;
        case "nack_discard":
          ch.nack(msg, false, false);
          break;
      }
    } catch (err) {
      console.error("Error parsing/handling message:", err);
      // NackDiscard on error to process next message
      ch.nack(msg, false, false);
    }
  });
}

export async function subscribeJSON<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  await subscribe(
    conn,
    exchange,
    queueName,
    routingKey,
    queueType,
    handler,
    (data) => JSON.parse(data.toString()) as T,
  );
}

export async function subscribeMsgPack<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  routingKey: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  await subscribe(
    conn,
    exchange,
    queueName,
    routingKey,
    queueType,
    handler,
    (data) => decode(data) as T,
  );
}
