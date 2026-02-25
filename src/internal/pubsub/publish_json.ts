import { encode } from "@msgpack/msgpack";

export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const content = Buffer.from(JSON.stringify(value));
  return await ch.publish(exchange, routingKey, content, {contentType: "application/json"});
}

export async function publishMsgPack<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  try {
    const encoded = encode(value);
    const buffer: Buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    return await ch.publish(exchange, routingKey, buffer, {contentType: "application/x-msgpack"});
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }
}
