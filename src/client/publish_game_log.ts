import type { GameLog } from "../internal/gamelogic/logs";
import { publishMsgPack } from "../internal/pubsub/publish_json";
import { ExchangePerilTopic, GameLogSlug } from "../internal/routing/routing";

export async function publishGameLog(ch: ConfirmChannel, username: string, message: string): number {
  try {
    const gameLog: GameLog = {
      username,
      message,
      currentTime: Date.now(),
    }

    await publishMsgPack(ch,
		         ExchangePerilTopic,
		         `${GameLogSlug}.${username}`,
		         gameLog,
		        );
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    return 0;
  }
  
  return 1;
}
