import {ANSI} from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";
import Labyrinth from "./labyrint.mjs";
import { TIMEOUT } from "dns";
import { start } from "repl";

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

const splashScreen = new SplashScreen();

let splashInterval = setInterval(() => {

    splashScreen.update();
    splashScreen.draw();

}, 1000 / 60);

setTimeout(function(){
    clearInterval(splashInterval);
    startLabyrinth();
}, 3000);
function startLabyrinth(){
   
    const REFRESH_RATE = 250;

    let intervalID = null;
    let isBlocked = false;
    let state = null;

    function init() {
        //All levels available to the game. 
        state = new Labyrinth();
        intervalID = setInterval(update, REFRESH_RATE);
    }

    function update() {

        if (isBlocked) { return; }
        isBlocked = true;
        //#region core game loop
        state.update();
        state.draw();
        //#endregion
        isBlocked = false;
    }

    init();
    
}