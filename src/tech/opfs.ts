import { randomCouchString } from 'rxdb';
import {
    FileSystemSyncAccessHandle,
    Tech,
    TestDoc,
    WorkerMessage
} from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class OPFSMainThread implements Tech {
    public name = 'opfs-main-thread';
    public opfsRoot: FileSystemDirectoryHandle;


    async init(): Promise<void> {
        const root = await navigator.storage.getDirectory();
        this.opfsRoot = await root.getDirectoryHandle(this.name, {
            create: true
        });
    }


    async getData(): Promise<TestDoc[]> {
        throw new Error('not implemented');
        // const file = await this.fileHandle.getFile();
        // const data = await file.arrayBuffer();
        // if (data.byteLength === 0) {
        //     console.log('zero bytes');
        //     return [];
        // }

        // let dataString = decoder.decode(data);
        // if (dataString.slice(-1) === ',') {
        //     dataString = dataString.substring(0, dataString.length - 1);
        // }
        // const json = JSON.parse(dataString);
        // return json;
    }

    async writeDocs(docs: TestDoc[]) {
        if (docs.length === 0) {
            return;
        }

        await Promise.all(
            docs.map(async (doc) => {
                const fileHandle = await this.opfsRoot.getFileHandle(doc.id, {
                    create: true,
                });
                const writable = await fileHandle.createWritable({ keepExistingData: true });
                const dataString = JSON.stringify(docs);
                const dataBuffer = encoder.encode(dataString);
                await writable.write({
                    data: dataBuffer,
                    position: 0,
                    type: 'write'
                });
                writable.close();
            })
        );
    }

    async findDocs(ids: string[]): Promise<TestDoc[]> {
        return await Promise.all(
            ids.map(async (id) => {
                const fileHandle = await this.opfsRoot.getFileHandle(id, {
                    create: false,
                });
                const file = await fileHandle.getFile();
                const data = await file.arrayBuffer();
                const dataString = decoder.decode(data);
                const json = JSON.parse(dataString);
                return json;
            })
        );

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
        await (this.opfsRoot as any).remove();
    }
}


export class OPFSWebWorker implements Tech {
    public name = 'opfs-web-worker';
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

    async findDocs(ids: string[]) {
        return this.callWorker('findDocs', [ids]);
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
        return this.callWorker('clear', []);
    }
}




export class OPFSInsideOfWorker implements Tech {
    public name = 'opfs-inside-of-worker';
    public opfsRoot: FileSystemDirectoryHandle;

    async init(): Promise<void> {
        const root = await navigator.storage.getDirectory();
        this.opfsRoot = await root.getDirectoryHandle(this.name, {
            create: true
        });
    }

    async getData(): Promise<TestDoc[]> {
        throw new Error('not implemented');
        // const accessHandle: FileSystemSyncAccessHandle = await (this.fileHandle as any).createSyncAccessHandle();
        // const size = await accessHandle.getSize();
        // const data = new Uint8Array(size);
        // await accessHandle.read(data, {});
        // if (data.byteLength === 0) {
        //     console.log('zero bytes');
        //     return [];
        // }
        // let dataString = decoder.decode(data);
        // console.log('dataString:');
        // console.dir(dataString);
        // if (dataString.slice(-1) === ',') {
        //     dataString = dataString.substring(0, dataString.length - 1);
        // }
        // const json = JSON.parse(dataString);
        // return json;
    }

    async writeDocs(docs: TestDoc[]) {
        if (docs.length === 0) {
            return;
        }

        await Promise.all(
            docs.map(async (doc) => {
                const fileHandle = await this.opfsRoot.getFileHandle(doc.id, {
                    create: true,
                });
                const accessHandle: FileSystemSyncAccessHandle = await (fileHandle as any).createSyncAccessHandle();
                const dataString = JSON.stringify(doc);
                const dataBuffer = encoder.encode(dataString);
                const size = await accessHandle.getSize();
                await accessHandle.write(dataBuffer, {
                    at: size
                });
                accessHandle.close();
            })
        );
    }

    async findDocs(ids: string[]): Promise<TestDoc[]> {
        return await Promise.all(
            ids.map(async (id) => {
                const fileHandle = await this.opfsRoot.getFileHandle(id, {
                    create: false,
                });
                const accessHandle: FileSystemSyncAccessHandle = await (fileHandle as any).createSyncAccessHandle();
                const fileSize = await accessHandle.getSize();
                const readBuffer = new Uint8Array(fileSize);
                const readSize = accessHandle.read(readBuffer, { at: 0 });
                const contentAsString = new TextDecoder().decode(readBuffer);
                accessHandle.close();
                return JSON.parse(contentAsString);
            })
        );
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
        await (this.opfsRoot as any).remove();
    }
}



export async function listDirectoryContents(directoryHandle, depth) {
    depth = depth || 1;
    directoryHandle = directoryHandle || await navigator.storage.getDirectory();
    const entries = await directoryHandle.values();

    for await (const entry of entries) {
        // Add proper indentation based on the depth
        const indentation = '    '.repeat(depth);

        if (entry.kind === 'directory') {
            // If it's a directory, log its name 
            // and recursively list its contents
            console.log(`${indentation}${entry.name}/`);
            await listDirectoryContents(entry, depth + 1);
        } else {
            // If it's a file, log its name
            console.log(`${indentation}${entry.name}`);
        }
    }
}
