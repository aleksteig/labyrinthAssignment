import {ANSI} from "./utils/ANSI.mjs";
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

let levelData = readMapFile(levels[startingLevel]);
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

const THINGS = [LOOT, EMPTY];
const INTERACTIBLES = [DOOR_TO_LEVEL_1, DOOR_TO_LEVEL_2, DOOR_TO_LEVEL_3];
const OTHER_INTERACTIBLES = [TELEPORTER];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 10,
    cash: 0
}

class Labyrinth {

    constructor() {
        this.lastEventTime = 0;
        this.eventDuration = 2000;
    }

    update() {

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

        let dRow = 0;
        let dCol = 0;

        if (KeyBoardManager.isUpPressed()) {
            dRow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            dRow = 1;
        }
        if (KeyBoardManager.isLeftPressed()) {
            dCol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dCol = 1;
        }

        let tRow = playerPos.row + (1 * dRow);
        let tCol = playerPos.col + (1 * dCol);

        if(INTERACTIBLES.includes(level[tRow][tCol])){

            playerPos.row = null;
            playerPos.col = null;
            
            let interactible = level[tRow][tCol];
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

            this.enemies = null;

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

            dRow = 0;
            dCol = 0;

            tRow = playerPos.row + (1 * dRow);
            tCol = playerPos.col + (1 * dCol);
            
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;

        }else {
            direction *= -1;
        }

        if(OTHER_INTERACTIBLES.includes(level[tRow][tCol])){

            let currentItem = level[tRow][tCol];
            if (currentItem == TELEPORTER){

                level[playerPos.row][playerPos.col] = EMPTY;
                level[tRow][tCol] = EMPTY;
                playerPos.row = null;

                if (playerPos.row == null) {
                    for (let row = 0; row < level.length; row++) {
                        for (let col = 0; col < level[row].length; col++) {
                            if (level[row][col] == TELEPORTER) {
                                tRow = row;
                                tCol = col;
                                level[tRow][tCol] = HERO;
                                playerPos.row = tRow;
                                playerPos.col = tCol;
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

        if (THINGS.includes(level[tRow][tCol])) {

            let currentItem = level[tRow][tCol];
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained ${loot}$`;
                this.lastEventTime = Date.now();
            }

            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;

            playerPos.row = tRow;
            playerPos.col = tCol;

        } else {
            direction *= -1;
        }

        // Find enemy coordinates and push it and their states to an alterable array
        const PATROL_LIMIT = 2;
        if (!this.enemies) {
            this.enemies = [];
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] === ENEMY) {
                        this.enemies.push({
                            row,
                            col,
                            direction: 1, // Sets initial movement to the right
                            distanceMoved: 0 // Counts the distance moved to allow for changing direction after reaching PATROL_LIMIT
                        });
                    }
                }
            }
        }

        // Clears the enemy's previous positions so as to not duplicate their position after moving
        for (let enemy of this.enemies) {
            level[enemy.row][enemy.col] = EMPTY;
        }

        // Enemy movement (Only horizontal movement)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            let newRow = enemy.row;
            let newCol = enemy.col + enemy.direction;

            // Checks to see if the player is nearby the enemy (to allow for attacks from above and below)
            let isPlayerNearby = 
                (newRow === playerPos.row && newCol === playerPos.col) ||
                (enemy.row - 1 === playerPos.row && enemy.col === playerPos.col) ||
                (enemy.row + 1 === playerPos.row && enemy.col === playerPos.col);

            // Based on if the enemy was nearby, deals up to 3 damage and removes them from the current level
            if (isPlayerNearby) {
                let damage = Math.floor(Math.random() * 3);
                playerStats.hp -= damage;
                eventText = `Player lost ${damage} HP from an enemy attack!`;
                this.lastEventTime = Date.now();

                // Remove the enemy from the level to prevent constant damage
                this.enemies.splice(i, 1);
                level[enemy.row][enemy.col] = EMPTY;

                isDirty = true;
                continue;
            }

            // Checks to see if the new position of the enemy is a wall or an object and changes direction if patrol limit is reached or an object that isn't the player is hit
            let isWithinBounds = newCol >= 0 && newCol < level[newRow].length;
            if (isWithinBounds && level[newRow][newCol] === EMPTY && enemy.distanceMoved < PATROL_LIMIT) {
                // Based on the check, moves it
                enemy.col = newCol;
                enemy.distanceMoved++;
            } else {
                // Changes direction and sets distance moved to 0 to allow for a patrol back again
                enemy.direction *= -1;
                enemy.distanceMoved = 0;
            }
        }

        // Places the enemies into the level when you re-enter a level where you killed some of them before
        for (let enemy of this.enemies) {
            level[enemy.row][enemy.col] = ENEMY;
        }

        isDirty = true;
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += renderHud();

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
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventText != "" && (Date.now() - this.lastEventTime) < this.eventDuration) {
            console.log(eventText);
        }else{
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.cash}`;
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