import { appendToArray } from 'rxdb/plugins/utils';
import { Tech, TestDoc } from '../types';

export class Cookies implements Tech {
    public name = 'cookies-bulk';

    constructor() {

    }

    async init() {
    }


    private allDocs(): TestDoc[] {
        const pairs = document.cookie.split(";");
        const result: TestDoc[] = [];
        for (let index = 0; index < pairs.length; index++) {
            const pair = pairs[index];
            const data = pair.split('=')[1];
            if (data) {
                const doc = JSON.parse(data);
                result.push(doc);
            }
        }
        return result;
    }

    async writeDocs(docs: TestDoc[]) {
        for (let index = 0; index < docs.length; index++) {
            const doc = docs[index];
            const jsonData = JSON.stringify(doc);
            document.cookie = doc.id + '=' + jsonData;
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


    /**
     * @link https://stackoverflow.com/questions/179355/clearing-all-cookies-with-javascript
     */
    async clear() {
        const cookies = document.cookie.split("; ");
        for (var c = 0; c < cookies.length; c++) {
            var d = window.location.hostname.split(".");
            while (d.length > 0) {
                var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                var p = location.pathname.split('/');
                document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    document.cookie = cookieBase + p.join('/');
                    p.pop();
                };
                d.shift();
            }
        }
    }
};
