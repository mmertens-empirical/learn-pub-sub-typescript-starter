import type { ConfirmChannel } from "amqplib";

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
