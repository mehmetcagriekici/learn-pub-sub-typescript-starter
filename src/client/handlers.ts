import process from 'node:process';
import amqp from "amqplib";

import { GameState } from "../internal/gamelogic/gamestate";
import type { PlayingState } from "../internal/gamelogic/gamestate";
import { handlePause } from "../internal/gamelogic/pause";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move";
import { AckType } from "../internal/pubsub/subscribe_json";
import { publishJSON } from "../internal/pubsub/publish_json";
import { handleWar, WarOutcome } from "../internal/gamelogic/war";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing";
import { publishGameLog } from "./publish_game_log";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    process.stdout.write("> ");
    return AckType.Ack
  }
}

export function handlerMove(ch: ConfirmChannel, gs: GameState): (move: ArmyMove) => Promise<AckType> {
  return async (move: ArmyMove) => {
    try {
      const moveOutcome = handleMove(gs, move);
      process.stdout.write("> ");
      if (moveOutcome === MoveOutcome.Safe) return AckType.Ack;
      if (moveOutcome === MoveOutcome.SamePlayer) return AckType.NackDiscard;
    
      if (moveOutcome === MoveOutcome.MakeWar) {
        const rw: RecognitionOfWar = {
  	  attacker: move.player,
	  defender: gs.getPlayerSnap(),
        };
      
        await publishJSON(ch,
			  ExchangePerilTopic,
			  `${WarRecognitionsPrefix}.${gs.getUsername()}`,
			  rw,
		         );
      
        return AckType.Ack;
      }
    } catch (err) {
       return AckType.NackRequeue;
    }

    return AckType.NackDiscard;
  }
}

export function handlerWar(ch: ConfirmChannel, gs: GameState): (rw: RecognitionOfWar) => Promise<AckType> {
  return async (rw: RecognitionOfWar) => {
    process.stdout.write("> ");
    const warResolution = handleWar(gs, rw);
    const username = gs.getUsername();
  
    if (warResolution.result === WarOutcome.NotInvolved) return AckType.NackRequeue;
    if (warResolution.result === WarOutcome.NoUnits) return AckType.NackDiscard;

    let msg = "";
    if (warResolution.result === WarOutcome.OpponentWon) {
      msg = `${warResolution.winner} won a war against ${warResolution.loser}`;
      const res = await publishGameLog(ch, username, msg);
      if (!res) return AckType.NackRequeue;
      return AckType.Ack;
    }

    if (warResolution.result === WarOutcome.YouWon) {
      msg = `${warResolution.winner} won a war against ${warResolution.loser}`;
      const res = await publishGameLog(ch, username, msg);
      if (!res) return AckType.NackRequeue;
      return AckType.Ack;
    }

    if (warResolution.result === WarOutcome.Draw) {
      msg = `A war between ${warResolution.attacker} and ${warResolution.defender} resulted in a draw`;
      const res = await publishGameLog(ch, username, msg);
      if (!res) return AckType.NackRequeue;
      return AckType.Ack;
    }  

    console.error("Invalid war resolution.");
    return AckType.NackDiscard;
  }
} 
