import { GameState } from "../internal/gamelogic/gamestate";
import type { PlayingState } from "../internal/gamelogic/gamestate";
import { handlePause } from "../internal/gamelogic/pause";
import type { ArmyMove } from "../internal/gamelogic/gamedata";
import { handleMove } from "../internal/gamelogic/move";

export function handlerPause(gs: GameState): (ps: PlayingState) => void {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    console.log("> ");
  }
}

export function handlerMove(gs: GameState): (move: ArmyMove) => void {
  return (move: ArmyMove) => {
    const moveOutcome = handleMove(gs, move);
    console.log("> ");
  }
}
