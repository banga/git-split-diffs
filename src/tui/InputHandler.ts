import * as fs from 'fs';
import * as readline from 'readline';
import * as tty from 'tty';

export type KeyHandler = (key: string, ctrl: boolean) => void;

export class InputHandler {
    private ttyStream: tty.ReadStream | null = null;
    private handler: KeyHandler;

    constructor(handler: KeyHandler) {
        this.handler = handler;
    }

    start(): void {
        const fd = fs.openSync('/dev/tty', 'r');
        this.ttyStream = new tty.ReadStream(fd);
        this.ttyStream.setEncoding('utf-8');
        this.ttyStream.setRawMode(true);

        readline.emitKeypressEvents(this.ttyStream);

        this.ttyStream.on('keypress', (_str: string, key: readline.Key) => {
            if (!key) return;
            const ctrl = key.ctrl === true;
            const name = key.name ?? key.sequence ?? '';
            this.handler(name, ctrl);
        });

        this.ttyStream.resume();
    }

    stop(): void {
        if (this.ttyStream) {
            this.ttyStream.setRawMode(false);
            this.ttyStream.destroy();
            this.ttyStream = null;
        }
    }
}
