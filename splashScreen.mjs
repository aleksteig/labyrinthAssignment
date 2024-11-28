import { ANSI } from "./utils/ANSI.mjs";
//import { process } from "node:process";
import { stdin, stdout } from "node:process";


//function centerText(text) {
//    const terminalWidth = stdout.columns; // Get terminal width
//    const textLength = text.length;
//    const padding = Math.max(0, Math.floor((terminalWidth - textLength) / 2));
//    // Add padding spaces before the text
//    return ' '.repeat(padding) + text;
//  }

function centerText(text) {
    const padding = Math.max(0, (stdout.columns - text.split("\n")[0].length) / 2);
    return ' '.repeat(padding) + text;
}



let outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                       ░░ ░
`;

class SplashScreen {

    constructor() {
        this.color = ANSI.COLOR.WHITE;  
        this.counter = 0;
        this.counterPhase = false;
        this.buffer=outputGraphics;
        //outputGraphics = outputGraphics.centerHorizontal();
    }
    
    update() {
        this.counter += this.counterPhase ? 10 : -10;
        if(this.counter >= 255){
            this.counterPhase = false;
        } else if(this.counter <= 0) {
            this.counterPhase = true;
        }
        this.color = `\u001b[38;2;${this.counter};${this.counter};${this.counter}m`;
        this.buffer = "";
        for(let i=0;i<outputGraphics.length;i++) {
            this.buffer+=outputGraphics[i]==="█" ? outputGraphics[i] : `\x1b[38;5;125m` + outputGraphics[i] + ANSI.RESET;
        }
        this.buffer=this.buffer.replaceAll("█", this.color + "█" + ANSI.RESET);
    }

    draw() {
        //console.clear();
        //console.log(ANSI.CLEAR_SCREEN, outputGraphics.replaceAll('█', this.color + '█' + ANSI.RESET).replaceAll("▒", ANSI.COLOR.RED + "▒" + ANSI.RESET).replaceAll("░", ANSI.COLOR.RED + "░" + ANSI.RESET).replaceAll("▓", ANSI.COLOR.RED + "▓" + ANSI.RESET).replaceAll("▄", ANSI.COLOR.RED + "▄" + ANSI.RESET), ANSI.CURSOR_HOME);
        //console.log(ANSI.CLEAR_SCREEN, outputGraphics.replace(/([^█])+/g, `${ANSI.COLOR.RED}$1${ANSI.RESET}`).replaceAll('█', this.color + '█' + ANSI.RESET), ANSI.CURSOR_HOME);
        //console.log(ANSI.CLEAR_SCREEN, this.color + outputGraphics + ANSI.RESET, ANSI.CURSOR_HOME);
        
        console.log(ANSI.CLEAR_SCREEN, this.buffer, ANSI.CURSOR_HOME);
        //console.log(ANSI.CLEAR)
        //printCentered(this.buffer);
        //console.log(ANSI.CURSOR_HOME);
        
        //let res="";
        //for(let i=0;i<outputGraphics.length;i++) {
        //    res+=outputGraphics[i]==="█" ? this.color + outputGraphics[i] + ANSI.RESET : `\x1b[38;5;125m` + outputGraphics[i] + ANSI.RESET;
        //}
        //print(ANSI.CLEAR_SCREEN + res + ANSI.CURSOR_HOME);
        //console.log(ANSI.CLEAR_SCREEN, outputGraphics.replaceAll('█', this.color + '█' + ANSI.RESET), ANSI.CURSOR_HOME);
    }
}

Object.defineProperty(String.prototype, "centerHorizontal", {
    value:
    function centerHorizontal() {
        return printCentered(this);
    },
    configurable: true,
    writable:true
});

function printCentered(text) {
    const textBounds = calculateStringBounds(text);
    const sr = Math.round((stdout.rows - textBounds.height) * 0.5);
    const sc = Math.round((stdout.columns - textBounds.width) * 0.5);
    return printWithOffset(text, sr, sc);
}

function printWithOffset(text, row, col) {
    const lines = text.split("\n");
    let output = ANSI.moveCursorTo(row, 0);
    for (let line of lines) {
        output = `${output}${ANSI.CURSOR_RIGHT.repeat(col)}${line}\n`;
    }
    return print(output);
}
function calculateStringBounds(str) {
    str = str ?? "";
    const lines = str.split("\n");
    let minLineLength = str.length;
    let maxLineLength = 0;
    let height = lines.length;
    for (const line of lines) {
        minLineLength = Math.min(minLineLength, line.length);
        maxLineLength = Math.max(maxLineLength, line.length);
    }
    return { max: maxLineLength, min: minLineLength, height, width: maxLineLength }
}

function print(...text) {
    process.stdout.write(`${text.join("")}`);
}

//String.prototype.centerHorizontal = () => {
//    if(this) {
//        let meIns=this;
//        return `${ANSI.moveCursorTo(0, Math.ceil((stdout.columns - meIns.length) / 2))}${meIns}`;
//    }
//};

export default SplashScreen;