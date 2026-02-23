import amqp from "amqplib";

import { clientWelcome } from "../internal/gamelogic/gamelogic";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declare_and_bind";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing";

async function main() {
  console.log("Starting Peril client...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);

  const username = await clientWelcome();

  const [ch, queue] = await declareAndBind(conn,
					   ExchangePerilDirect,
					   `${PauseKey}.${username}`,
					   PauseKey,
					   SimpleQueueType.Transient,
					  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
