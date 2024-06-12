import { randomString } from 'async-test-util';
import { Tech, TestDoc } from '../types';

const STORE_NAME = 'mystore';

export class IndexedDBTech implements Tech {
    public name = 'indexeddb-cursor';
    dbName: string = randomString(10);
    db: IDBDatabase;

    constructor() {

    }

    async init() {
        console.log(' i 1');
        const request = indexedDB.open(this.dbName);
        await new Promise<void>(res => {
            request.onupgradeneeded = async (event: any) => {
                this.db = event.target.result;
                const objectStore = this.db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex("age", "age", { unique: false });
                objectStore.transaction.oncomplete = (e) => {
                    res();
                };
            };
        });
    }

    async writeDocs(docs: TestDoc[]) {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (let index = 0; index < docs.length; index++) {
            const doc = docs[index];
            store.add(doc);
        }
        await new Promise<void>((res, rej) => {
            tx.oncomplete = () => res();
            tx.onerror = (err) => rej(err);
        });
    }

    async queryRegex(regex: RegExp): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        let result: TestDoc[] = [];
        await new Promise<void>(res => {
            store.openCursor().onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    const doc: TestDoc = cursor.value;
                    if (doc.longtext.match(regex)) {
                        result.push(doc);
                    }
                    cursor.continue();
                } else {
                    res();
                }
            };
        });
        return result;
    }
    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('age');
        const range = IDBKeyRange.lowerBound(minAge);
        let result: TestDoc[] = [];
        await new Promise<void>(res => {
            index.openCursor(range).onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    const doc: TestDoc = cursor.value;
                    result.push(doc);
                    cursor.continue();
                } else {
                    res();
                }
            };
        });
        return result;
    }
    async queryRegexIndex(regex: RegExp, minAge: number): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('age');
        const range = IDBKeyRange.lowerBound(minAge);
        let result: TestDoc[] = [];
        await new Promise<void>(res => {
            index.openCursor(range).onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    const doc: TestDoc = cursor.value;
                    if (doc.longtext.match(regex)) {
                        result.push(doc);
                    }
                    cursor.continue();
                } else {
                    res();
                }
            };
        });
        return result;
    }


    async clear() {
        const request = indexedDB.deleteDatabase(this.dbName);
        await new Promise<void>(res => {
            request.onsuccess = (event: any) => {
                res();
            };
        });
    }
};
