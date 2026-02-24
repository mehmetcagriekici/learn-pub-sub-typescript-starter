import amqp from "amqplib";

import { clientWelcome, printClientHelp, getInput, commandStatus, printQuit } from "../internal/gamelogic/gamelogic";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declare_and_bind";
import { subscribeJSON } from "../internal/pubsub/subscribe_json";
import { publishJSON } from "../internal/pubsub/publish_json";
import { ExchangePerilDirect, ExchangePerilTopic, PauseKey, ArmyMovesPrefix } from "../internal/routing/routing";
import { GameState } from "../internal/gamelogic/gamestate";
import { commandSpawn } from "../internal/gamelogic/spawn";
import { commandMove } from "../internal/gamelogic/move";
import { handlerPause, handlerMove } from "./handlers";

async function main() {
  console.log("Starting Peril client...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  const cch = await conn.createConfirmChannel();
  
  const username = await clientWelcome();

  const [ch, queue] = await declareAndBind(conn,
					   ExchangePerilDirect,
					   `${PauseKey}.${username}`,
					   PauseKey,
					   SimpleQueueType.Transient,
					  );
  
  const gameState = new GameState(username);
  await subscribeJSON(conn,
		      ExchangePerilDirect,
		      `${PauseKey}.${username}`,
		      PauseKey,
		      SimpleQueueType.Transient,
		      handlerPause(gameState),
		     );

  await subscribeJSON(conn,
		      ExchangePerilTopic,
		      `${ArmyMovesPrefix}.${username}`,
		      `${ArmyMovesPrefix}.*`,
		      SimpleQueueType.Transient,
		      handlerMove(gameState),
		     );

  while (true) {
    const words = await getInput();
    if (words.length === 0) {
      continue;
    }

    const firstWord = words[0];
    if (firstWord === "spawn") {
      try {
	commandSpawn(gameState, words);
      } catch (err) {
	if (err instanceof Error) {
	  console.log(err);
	}
      } finally {
	continue;
      } 
    }

    if (firstWord === "move") {
      try {
	const armyMove = commandMove(gameState, words);
	await publishJSON(cch,
			  ExchangePerilTopic,
			  `${ArmyMovesPrefix}.${username}`,
			  armyMove,
			 );
	console.log(`Player ${armyMove.player.username} units ${armyMove.units.reduce((acc, u) => u.id,"")} successfully moved to ${armyMove.toLocation}.`);
      } catch (err) {
	if (err instanceof Error) console.log(error);
      } finally {
	continue;
      }
    }

    if (firstWord === "status") {
      await commandStatus(gameState);
      continue;
    }

    if (firstWord === "help") {
      printClientHelp();
      continue;
    }

    if (firstWord === "quit") {
      printQuit();
      process.exit(0);
      break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
