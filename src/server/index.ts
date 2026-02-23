import amqp from "amqplib";
import process from 'node:process';

import { publishJSON } from "../internal/pubsub/publish_json";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing";
import type { PlayingState } from "../internal/gamelogic/gamestate";
o
async function main() {
  console.log("Starting Peril server...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);

  console.log("Successfully connected to the RabbitMQ broker.");

  const ch = await conn.createConfirmChannel();

  const playingState: PlayingState = {IsPlaying: true};
  await publishJSON(ch, ExchangePerilDirect, PauseKey, playingState);

  process.on('exit', () => {
    console.log(`Shutting down the Peril server...`);
    conn.close();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
