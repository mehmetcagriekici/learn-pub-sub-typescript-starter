import amqp from "amqplib";

import { SimpleQueueType, declareAndBind } from "./declare_and_bind"; 

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType, // an enum to represent "durable" or "transient"
  handler: (data: T) => void,
): Promise<void> {
  const [ch, queue] = await declareAndBind(conn,
					   exchange,
					   queueName,
					   key,
					   queueType,
					  );

  await ch.consume(queueName, function(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    handler(data);
    ch.ack(msg);
  });
}
