import * as events from 'events';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';

export class GrblHALFTP extends events.EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.logger = console.log;
    }

    async openConnection(address, port, user, pass, secure = false) {
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

        this.client.trackProgress(info => {
            console.log('File', info.name);
            console.log('Type', info.type);
            console.log('Transferred', info.bytes);
            console.log('Transferred Overall', info.bytesOverall);
        });
    }

    async sendFile(fileData) {
        console.log(fileData);
        const { name, data } = fileData;
        const dataStream = Readable.from(data);
        await this.client.uploadFrom(dataStream, name);
        this.client.close();
        this.client = null;
    }

    sendFiles(files = []) {}
}
