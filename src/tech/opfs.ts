import { randomCouchString } from 'rxdb';
import { FileSystemSyncAccessHandle, Tech, TestDoc, WorkerMessage } from '../types';


const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class OPFSMainThread implements Tech {
    public name = 'opfs-main-thread';
    fileHandle: FileSystemFileHandle;


    async init(): Promise<void> {
        const opfsRoot = await navigator.storage.getDirectory();
        this.fileHandle = await opfsRoot.getFileHandle(this.name, {
            create: true,
        });
    }


    async getData(): Promise<TestDoc[]> {
        const file = await this.fileHandle.getFile();
        const data = await file.arrayBuffer();
        if (data.byteLength === 0) {
            console.log('zero bytes');
            return [];
        }

        let dataString = decoder.decode(data);
        console.log('dataString:');
        console.dir(dataString);
        if (dataString.slice(-1) === ',') {
            dataString = dataString.substring(0, dataString.length - 1);
        }
        const json = JSON.parse(dataString);
        return json;
    }

    async writeDocs(docs: TestDoc[]) {
        if (docs.length === 0) {
            return;
        }
        const dataString = JSON.stringify(docs) + ',';
        const dataBuffer = encoder.encode(dataString);
        const writable = await this.fileHandle.createWritable({ keepExistingData: true });

        const file = await this.fileHandle.getFile();
        const size = file.size;
        await writable.write({
            data: dataBuffer,
            position: size,
            type: 'write'
        });
    }

    async queryRegex(regex: string): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.longtext.includes(regex)) {
                result.push(doc);
            }
        }
        return result;
    }
    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.age >= minAge) {
                result.push(doc);
            }
        }
        return result;
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.age >= minAge && doc.longtext.includes(regex)) {
                result.push(doc);
            }
        }
        return result;
    }


    async clear() {
        const writable = await this.fileHandle.createWritable({ keepExistingData: true });
        await writable.truncate(0);
    }
}


export class OPFSWebWorker implements Tech {
    public name = 'opfs-web-worker';
    fileHandle: FileSystemFileHandle;
    worker: Worker;

    async init(): Promise<void> {
        this.worker = new Worker('./workers/opfs.worker.js');

        // wait for first message so that we know the worker is spawned up
        await new Promise(res => {
            const listener = (ev: MessageEvent<WorkerMessage>) => {
                const result = ev.data;
                if (result.id === 'first') {
                    this.worker.removeEventListener('message', listener);
                    res(ev.data.result);
                }
            }
            this.worker.addEventListener('message', listener);
        });
        await this.callWorker('init', []);
    }

    async callWorker(functionName: keyof Tech, params: any[]): Promise<any> {
        const id = randomCouchString(6);
        const send: WorkerMessage = {
            id,
            functionName,
            params
        };

        return new Promise(res => {
            const listener = (ev: MessageEvent<WorkerMessage>) => {
                const result = ev.data;
                if (result.id === id) {
                    this.worker.removeEventListener('message', listener);
                    res(ev.data.result);
                }
            }
            this.worker.addEventListener('message', listener);
            this.worker.postMessage(send);
        });
    }

    async writeDocs(docs: TestDoc[]) {
        return this.callWorker('writeDocs', [docs]);
    }

    async queryRegex(regex: string): Promise<TestDoc[]> {
        return this.callWorker('queryRegex', [regex]);
    }
    async queryIndex(minAge: number): Promise<TestDoc[]> {
        return this.callWorker('queryIndex', [minAge]);
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        return this.callWorker('queryRegexIndex', [regex, minAge]);
    }


    async clear() {
        return this.callWorker('writeDocs', []);
    }
}




export class OPFSInsideOfWorker implements Tech {
    public name = 'opfs-inside-of-worker';
    fileHandle: FileSystemFileHandle;

    async init(): Promise<void> {
        const opfsRoot = await navigator.storage.getDirectory();
        this.fileHandle = await opfsRoot.getFileHandle(this.name, {
            create: true,
        });
    }

    async getData(): Promise<TestDoc[]> {
        const accessHandle: FileSystemSyncAccessHandle = await (this.fileHandle as any).createSyncAccessHandle();
        const size = await accessHandle.getSize();
        const data = new Uint8Array(size);
        await accessHandle.read(data, {});
        if (data.byteLength === 0) {
            console.log('zero bytes');
            return [];
        }
        let dataString = decoder.decode(data);
        console.log('dataString:');
        console.dir(dataString);
        if (dataString.slice(-1) === ',') {
            dataString = dataString.substring(0, dataString.length - 1);
        }
        const json = JSON.parse(dataString);
        return json;
    }

    async writeDocs(docs: TestDoc[]) {
        if (docs.length === 0) {
            return;
        }
        const dataString = JSON.stringify(docs) + ',';
        const dataBuffer = encoder.encode(dataString);
        const accessHandle: FileSystemSyncAccessHandle = await (this.fileHandle as any).createSyncAccessHandle();
        const size = await accessHandle.getSize();
        await accessHandle.write(dataBuffer, {
            at: size
        });
    }


    async queryRegex(regex: string): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.longtext.includes(regex)) {
                result.push(doc);
            }
        }
        return result;
    }

    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.age >= minAge) {
                result.push(doc);
            }
        }
        return result;
    }

    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        const allDocs = await this.getData();
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.age >= minAge && doc.longtext.includes(regex)) {
                result.push(doc);
            }
        }
        return result;
    }

    async clear() {
        const writable = await this.fileHandle.createWritable({ keepExistingData: true });
        await writable.truncate(0);
    }
}

