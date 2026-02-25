import process from 'node:process';

import type { GameLog } from "../internal/gamelogic/logs";
import { writeLog } from "../internal/gamelogic/logs";

export function handlerLog() {
  return async (gameLog: GameLog) => {
    await writeLog(gameLog);
    process.stdout.write("> ");
  }
}
