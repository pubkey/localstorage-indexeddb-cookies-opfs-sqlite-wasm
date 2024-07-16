import { Tech, TestDoc } from '../types';

const STORE_NAME = 'mystore';

export class IndexedDBCursor implements Tech {
    public name = 'indexeddb-cursor';
    db: IDBDatabase;

    constructor() {

    }

    async init() {
        const request = indexedDB.open(this.name);
        await new Promise<void>((res, rej) => {
            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                res();
            };
            request.onerror = (err) => rej(err);
            request.onupgradeneeded = async (event: any) => {
                console.log('upgrade needed');
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

    async queryRegex(regex: string): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        let result: TestDoc[] = [];
        await new Promise<void>(res => {
            store.openCursor().onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    const doc: TestDoc = cursor.value;
                    if (doc.longtext.includes(regex)) {
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
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
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
                    if (doc.longtext.includes(regex)) {
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
        const request = indexedDB.deleteDatabase(this.name);
        await new Promise<void>(res => {
            request.onsuccess = (event: any) => {
                res();
            };
        });
    }
};



export class IndexedDBBulk extends IndexedDBCursor {
    public name = 'indexeddb-bulk';
    async queryRegex(regex: string): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const allDocs = await new Promise<TestDoc[]>((res, err) => {
            const request = store.getAll();
            request.onsuccess = () => res(request.result);
            request.onerror = () => err();
        });
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
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('age');
        const range = IDBKeyRange.lowerBound(minAge);
        const allDocs = await new Promise<TestDoc[]>((res, err) => {
            const request = index.getAll(range);
            request.onsuccess = () => res(request.result);
            request.onerror = () => err();
        });
        return allDocs;
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        const tx: IDBTransaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('age');
        const range = IDBKeyRange.lowerBound(minAge);

        const allDocs = await new Promise<TestDoc[]>((res, err) => {
            const request = index.getAll(range);
            request.onsuccess = () => res(request.result);
            request.onerror = () => err();
        });
        const result: TestDoc[] = [];
        for (let index = 0; index < allDocs.length; index++) {
            const doc = allDocs[index];
            if (doc.longtext.includes(regex)) {
                result.push(doc);
            }
        }
        return result;
    }
};
