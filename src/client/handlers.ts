import { GameState } from "../internal/gamelogic/gamestate";
import type { PlayingState } from "../internal/gamelogic/gamestate";
import { handlePause } from "../internal/gamelogic/pause";
import type { ArmyMove } from "../internal/gamelogic/gamedata";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move";
import { AckType } from "../internal/pubsub/subscribe_json";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    console.log("> ");
    return AckType.Ack
  }
}

export function handlerMove(gs: GameState): (move: ArmyMove) => AckType {
  return (move: ArmyMove) => {
    const moveOutcome = handleMove(gs, move);
    console.log("> ");
    if (moveOutcome === MoveOutcome.Safe || moveOutcome === MoveOutcome.MakeWar) return AckType.Ack;
    if (moveOutcome === MoveOutcome.SamePlayer) return AckType.NackDiscard;
    return AckType.NackDiscard;
  }
}
