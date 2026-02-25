import amqp from "amqplib";
import process from 'node:process';

import { publishJSON } from "../internal/pubsub/publish_json";
import { SimpleQueueType } from "../internal/pubsub/declare_and_bind";
import { subscribeMsgPack } from "../internal/pubsub/subscribe_json";
import { ExchangePerilDirect, PauseKey, ExchangePerilTopic, GameLogSlug } from "../internal/routing/routing";
import { printServerHelp, getInput } from "../internal/gamelogic/gamelogic";
import { handlerLog } from "./handlers";

async function main() {
  console.log("Starting Peril server...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);

  console.log("Successfully connected to the RabbitMQ broker.");

  const ch = await conn.createConfirmChannel();

  if (!process.stdin.isTTY) {
    console.log("Non-interactive mode: skipping command input.");
    return;
  }

  printServerHelp();

  const routingKey = `${GameLogSlug}.*`;
  await subscribeMsgPack(conn,
			 ExchangePerilTopic,
			 GameLogSlug,
			 routingKey,
			 SimpleQueueType.Durable,
			 handlerLog(),
			);
  while (true) {
    const words = await getInput();
    if (words.length === 0) {
      continue;
    }

    const firstWord = words[0];
    if (firstWord === "pause") {
      await publishJSON(ch, ExchangePerilDirect, PauseKey, {isPaused: true});
      continue;
    }
1
    if (firstWord === "resume") {
      await publishJSON(ch, ExchangePerilDirect, PauseKey, {isPaused: false});
      continue;
    }

    if (firstWord === "close") {
      process.exit(0);
      break;
    }
  }

  process.on('exit', () => {
    console.log(`Shutting down the Peril server...`);
    conn.close();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
