// App wiring. Keep thin: the game (package 1) and the UI (package 2) mount themselves.
import { startGame } from "./game";
import { startUi } from "./ui";

startGame(document.getElementById("game") as HTMLElement);
startUi(document.getElementById("ui") as HTMLElement);
