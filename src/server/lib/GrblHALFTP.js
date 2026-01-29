import * as events from 'events';
import { Client } from 'basic-ftp';

export class GrblHALFTP extends events.EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.logger = console.log;
    }

    async openConnection(address, port, user, pass, secure = true) {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        this.logger(`Connecting to ${address}:${port}`);

        this.client = new Client();
        this.client.ftp.verbose = true;
        await this.client.access({
            host: address,
            port: port,
            user: user,
            password: pass,
            secure: secure,
        });
    }

    sendFile(fileData) {}

    sendFiles() {}
}
