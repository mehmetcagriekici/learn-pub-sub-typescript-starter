export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const content = Buffer.from(JSON.stringify(value));
  await ch.publish(exchange, routingKey, content, {contentType: "application/json"});
}
