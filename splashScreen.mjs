import { ANSI } from "./utils/ANSI.mjs";

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
        console.log(ANSI.CLEAR_SCREEN, this.buffer, ANSI.CURSOR_HOME);
    }
}

export default SplashScreen;