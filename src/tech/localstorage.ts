import { randomString } from 'async-test-util';
import { Tech, TestDoc } from '../types';
import { batchArray, appendToArray } from 'rxdb/plugins/utils';

export class Localstorage implements Tech {
    public name = 'localstorage-bulk';
    constructor() {

    }

    async init() {
    }


    private allDocs(): TestDoc[] {
        const result: TestDoc[] = [];
        let t = 0;
        while (true) {
            const data = localStorage.getItem('docs_' + t);
            if (!data) {
                return result;
            }
            const part = JSON.parse(data);
            appendToArray(result, part);
            t++;
        }
    }

    async writeDocs(docs: TestDoc[]) {
        const batches = batchArray(docs, 500);

        for (let index = 0; index < batches.length; index++) {
            const batch = batches[index];

            for (let t = 0; t < batch.length; t++) {
                const doc = batch[index];
                localStorage.setItem('doc_' + doc.id, JSON.stringify(doc));
            }
        }
    }

    async findDocs(ids: string[]): Promise<TestDoc[]> {
        const docs: TestDoc[] = [];
        for (let index = 0; index < ids.length; index++) {
            const id = ids[index];
            const stringData = localStorage.getItem('doc_' + id);
            docs.push(JSON.parse(stringData));
        }
        return docs;
    }

    async queryRegex(regex: string): Promise<TestDoc[]> {
        const allDocs = this.allDocs();
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
        const allDocs = this.allDocs();
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
        const allDocs = this.allDocs();
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
        let t = 0;
        while (true) {
            const data = localStorage.getItem('docs_' + t);
            if (!data) {
                return;
            }
            localStorage.removeItem('docs_' + t);
            t++;
        }
    }
};
