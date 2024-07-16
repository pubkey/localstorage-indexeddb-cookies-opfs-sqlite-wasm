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
            localStorage.setItem('docs_' + index, JSON.stringify(batch));
        }
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
