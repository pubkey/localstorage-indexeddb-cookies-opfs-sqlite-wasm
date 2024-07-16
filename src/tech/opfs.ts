import { Tech, TestDoc } from '../types';


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
        console.log('write string: ' + dataString);
        const dataBuffer = encoder.encode(dataString);
        const writable = await this.fileHandle.createWritable({ keepExistingData: true });

        const file = await this.fileHandle.getFile();
        const size = file.size;
        console.log('position: ' + size);
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
