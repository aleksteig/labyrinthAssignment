import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import { start } from "repl";


const startingLevel = CONST.START_LEVEL_ID;
const re_enter_first_level = CONST.FIRST_LEVEL_RE_ENTER_ID;
const secondLevel = CONST.SECOND_LEVEL_ID;
const re_enter_second_level = CONST.SECOND_LEVEL_RE_ENTER_ID;
const thirdLevel = CONST.THIRD_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[thirdLevel]);
let level = levelData;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
    "X": ANSI.COLOR.BLACK,
    "\u2668": ANSI.COLOR.YELLOW,
}

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const ENEMY = "X";
const TELEPORTER = "\u2668";
const DOOR_TO_LEVEL_1 = "1";
const DOOR_TO_LEVEL_2 = "2";
const DOOR_TO_LEVEL_3 = "3";

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, ENEMY];
const INTERACTIBLES = [DOOR_TO_LEVEL_1, DOOR_TO_LEVEL_2, DOOR_TO_LEVEL_3];
const OTHER_INTERACTIBLES = [TELEPORTER];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    chash: 0
}

class Labyrinth {

    update() {
        let enemies = [];
        let patrolPattern = {
            horizontal: {drow: 0, dcol: 1},
            vertical: {drow: 1, dcol: 0},
            standStill: {drow: 0, dcol: 0}
        }
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] == ENEMY) {
                    enemies.push({
                    row: row,
                    col: col,
                    direction: patrolPattern.horizontal,
                    })
                }
            }
        }

        for(let enemy of enemies){
            let newRow = enemy.row + enemy.direction.drow
            let newCol = enemy.col + enemy.direction.dcol

            if(level[newRow] && level[newRow][newCol] === EMPTY){
                level[enemy.row][enemy.col] = EMPTY;
                enemy.row = newRow;
                enemy.col = newCol;
                level[enemy.row][enemy.col] = ENEMY;
                isDirty = true;
            }else{
                enemy.direction *= -1;
            }
        }

        

        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = playerPos.row + (1 * drow);
        let tcol = playerPos.col + (1 * dcol);

        if(INTERACTIBLES.includes(level[tRow][tcol])){
            playerPos.row = null;
            playerPos.col = null;
            
            let interactible = level[tRow][tcol];
            if (interactible == DOOR_TO_LEVEL_1){
                levelData = readMapFile(levels[re_enter_first_level]);
                level = levelData;
            }else if(interactible == DOOR_TO_LEVEL_2){
                if(tRow >= 2){
                    levelData = readMapFile(levels[secondLevel]);
                    level = levelData;
                }else if(tRow <= 1){
                    levelData = readMapFile(levels[re_enter_second_level]);
                    level = levelData;
                }
            }else if(interactible == DOOR_TO_LEVEL_3){
                levelData = readMapFile(levels[thirdLevel]);
                level = levelData;
            }
            tRow = null;
            tcol = null;
            if (playerPos.row == null) {
                for (let row = 0; row < level.length; row++) {
                    for (let col = 0; col < level[row].length; col++) {
                        if (level[row][col] == HERO) {
                            playerPos.row = row;
                            playerPos.col = col;
                            break;
                        }
                    }
                    if (playerPos.row != undefined) {
                        break;
                    }
                }
            }
            drow = 0;
            dcol = 0;

            tRow = playerPos.row + (1 * drow);
            tcol = playerPos.col + (1 * dcol);
            
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            isDirty = true;

        }else {
            direction *= -1;
        }

        if(OTHER_INTERACTIBLES.includes(level[tRow][tcol])){
            let currentItem = level[tRow][tcol];
            if (currentItem == TELEPORTER){
                level[playerPos.row][playerPos.col] = EMPTY;
                level[tRow][tcol] = EMPTY;
                playerPos.row = null;
                if (playerPos.row == null) {
                    for (let row = 0; row < level.length; row++) {
                        for (let col = 0; col < level[row].length; col++) {
                            if (level[row][col] == TELEPORTER) {
                                tRow = row;
                                tcol = col;
                                level[tRow][tcol] = HERO;
                                playerPos.row = tRow;
                                playerPos.col = tcol;
                                isDirty = true;
                                break;
                            }
                        }
                        if (playerPos.row != undefined) {
                            break;
                        }
                    }
                }
            }
        }

        if (THINGS.includes(level[tRow][tcol])) { // Is there anything where Hero is moving to

            let currentItem = level[tRow][tcol];
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.chash += loot;
                eventText = `Player gained ${loot}$`;
            } else if (currentItem == ENEMY){
                let playerHP = Math.round(Math.random() * 3);
                playerStats.hp -= playerHP;
                eventText = `Player lost ${playerHP} amount of HP in battle`;
            }

            // Move the HERO
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            // Update the HERO
            playerPos.row = tRow;
            playerPos.col = tcol;

            // Make the draw function draw.
            isDirty = true;
        } else {
            direction *= -1;
        }
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = "";

        rendring += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendring += rowRendering;
        }

        console.log(rendring);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}


export default Labyrinth;