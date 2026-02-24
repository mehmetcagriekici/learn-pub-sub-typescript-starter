import amqp from "amqplib";

import { SimpleQueueType, declareAndBind } from "./declare_and_bind"; 

export enum AckType {
  Ack,
  NackRequeue,
  NackDiscard,
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType, // an enum to represent "durable" or "transient"
  handler: (data: T) => AckType,
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
    const ackType = handler(data);
    switch (ackType) {
      case AckType.Ack:
	ch.ack(msg);
	break;
      case AckType.NackRequeue:
	ch.nack(msg, false, true);
	break;
      case AckType.NackDiscard:
	ch.nack(msg, false, false);
	break;
      default:
	console.log("Invalid Ack Type");
    }
    
    console.log("Message acknowledged.");
  });
}
