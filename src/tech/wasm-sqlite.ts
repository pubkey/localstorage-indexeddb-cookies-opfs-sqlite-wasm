import { randomString } from 'async-test-util';
import { Tech, TestDoc } from '../types';
import sqlite3InitModule, { Database } from '@sqlite.org/sqlite-wasm';
import { IDBBatchAtomicVFS } from "wa-sqlite/src/examples/IDBBatchAtomicVFS.js";
import { batchArray } from 'rxdb/plugins/utils';
const TABLE_NAME = 'mytable';
const log = console.log;
const error = console.error;

/**
 * Running SQL statements with too many variables
 * will throw with:
 * 'SQLITE_ERROR: too many SQL variables'
 */
export const SQLITE_VARIABLES_LIMIT = 999;

export class WASQLiteMemory implements Tech {
    public name = 'wa-sqlite-memory';
    db: Database;
    dbNr: number;
    sqlite3: SQLiteAPI;

    constructor() {

    }

    async init() {
        // @ts-ignore
        const SQLiteESMFactory = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
        // @ts-ignore
        const SQLite = await import('wa-sqlite');
        const module = await SQLiteESMFactory.default({
            locateFile(file: string) {
                console.log('locate file !');
                return `/wasm/${file}`;
            }
        });
        this.sqlite3 = SQLite.Factory(module);
        this.dbNr = await this.sqlite3.open_v2(randomString(10));

        await this.run(`
        CREATE TABLE myTable (
            id TEXT PRIMARY KEY,
            age INTEGER,
            longtext TEXT,
            nes JSON,
            list JSON
        );
        `);
    }

    async writeDocs(docs: TestDoc[]): Promise<any> {
        /**
         * Doing all writes in a single sql statement could
         * throw with a 'too many variables' error, so we have to batch the writes.
         */
        const variablesPerWriteRow = 5;
        const writeBatches = batchArray(docs, SQLITE_VARIABLES_LIMIT / variablesPerWriteRow);
        const writeVariablesBlock = '(' + new Array(variablesPerWriteRow).fill('?').join(', ') + ')';


        for (const batch of writeBatches) {
            const insertQuery = `INSERT INTO "${TABLE_NAME}" (
                id,
                age,
                longtext,
                nes,
                list
            ) VALUES ${new Array(batch.length).fill(writeVariablesBlock).join(', ')}; `;
            const insertParams: any[] = [];
            batch.forEach(docData => {
                const docId = (docData as any).id;
                insertParams.push(docId);
                insertParams.push(docData.age);
                insertParams.push(docData.longtext);
                insertParams.push(JSON.stringify(docData.nes));
                insertParams.push(JSON.stringify(docData.list));
            });
            await this.all(insertQuery, insertParams);
        }
    }

    async run(query, params?) {
        await this.sqlite3.run(this.dbNr, query, params);
    }
    async all(query, params?) {
        const result = await this.sqlite3.execWithParams(this.dbNr, query, params);
        return result.rows;
    }

    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const resultRows = await this.all(`
            SELECT * FROM myTable WHERE age>=${minAge}
            `
        );
        const result = resultRows.map(row => sqlRowToObject(row));
        return result;
    }


    async queryRegex(regex: string): Promise<TestDoc[]> {
        const resultRows = await this.all(`
            SELECT * FROM myTable WHERE longtext LIKE '%${regex}%'
            `
        );
        const result = resultRows.map(row => sqlRowToObject(row));
        return result;
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        const resultRows = await this.all(`
        SELECT * FROM myTable WHERE longtext LIKE '%${regex}%' AND age>=${minAge}
        `
        );
        const result = resultRows.map(row => sqlRowToObject(row));
        return result;
    }
    async clear(): Promise<void> {
        return {} as any;
    }

}

export class WASQLiteIndexedDB extends WASQLiteMemory {
    public name = 'wa-sqlite-indexeddb';

    async init() {

        
        // @ts-ignore
        const SQLiteESMFactory = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
        // @ts-ignore
        const SQLite = await import('wa-sqlite');

        const vfs = new IDBBatchAtomicVFS('myDatabase');

        const module = await SQLiteESMFactory.default({
            locateFile(file: string) {
                console.log('locate file !');
                return `/wasm/${file}`;
            }
        });
        this.sqlite3 = SQLite.Factory(module);
        this.dbNr = await this.sqlite3.open_v2(randomString(10), undefined, vfs);

        await this.run(`
        CREATE TABLE myTable (
            id TEXT PRIMARY KEY,
            age INTEGER,
            longtext TEXT,
            nes JSON,
            list JSON
        );
        `);
    }
}



function sqlRowToObject(row: any[]): TestDoc {
    return {
        id: row[0],
        age: row[1],
        longtext: row[2],
        nes: JSON.parse(row[4]),
        list: JSON.parse(row[3]),
    }
}


/**
 * @link https://github.com/sqlite/sqlite-wasm?tab=readme-ov-file#in-the-main-thread-without-opfs
 * @link https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system
 */
export class WasmSQLiteWorker implements Tech {
    public name = 'wasm-sqlite-worker';
    dbName: string = randomString(10);
    db: Database;

    constructor() {

    }
    clear: () => Promise<void>;
    writeDocs: (docs: TestDoc[]) => Promise<any>;
    queryRegex: (regex: string) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: string, minAge: number) => Promise<TestDoc[]>;


    async init() {
        const promiser: any = await new Promise((resolve) => {
            const _promiser = sqlite3Worker1Promiser({
                onready: () => {
                    resolve(_promiser);
                },
            });
        });
        let response = await promiser('config-get', {});
        console.log('Running SQLite3 version', response.result.version.libVersion);




        // const sqlite3 = await sqlite3InitModule({
        //     print: log,
        //     printErr: error,
        // });
        // this.db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
        // await new Promise<void>(res => {
        //     this.db.exec(`
        //     CREATE TABLE myTable (
        //         id TEXT PRIMARY KEY,
        //         age INTEGER,
        //         longtext TEXT,
        //         nes JSON,
        //         list JSON
        //     );
        //     `, () => {
        //         res();
        //     });
        // });
    }

    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const result = await new Promise<any>(res => {
            this.db.exec(`
            SELECT * FROM myTable WHERE age>=${minAge}
            `);
        });
        console.dir(result);
        return result;
    }
}

/**
 * @link https://github.com/sqlite/sqlite-wasm?tab=readme-ov-file#in-the-main-thread-without-opfs
 * @link https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system
 */
export class WasmSQLiteMainThread implements Tech {
    public name = 'wasm-sqlite-main-thread';
    dbName: string = randomString(10);
    db: Database;

    constructor() {

    }
    clear: () => Promise<void>;
    writeDocs: (docs: TestDoc[]) => Promise<any>;
    queryRegex: (regex: string) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: string, minAge: number) => Promise<TestDoc[]>;


    async init() {
        console.log('i1');
        const sqlite3 = await sqlite3InitModule({
            print: log,
            printErr: error,
        });
        console.log('Running SQLite3 version', sqlite3.version.libVersion);
        console.log('i2');
        this.db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
        console.log('i3');
        sqlite3.oo1.OpfsDb
        await new Promise<void>(res => {
            this.db.exec({
                sql: `
            CREATE TABLE myTable (
                id TEXT PRIMARY KEY,
                age INTEGER,
                longtext TEXT,
                nes JSON,
                list JSON
            );
            `,
                returnValue: 'resultRows',
                resultRows: [],
                callback: () => {
                    console.log('Create table');
                    res();
                }
            });
        });
        console.log('i4');
    }

    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const result = await new Promise<any>(res => {
            this.db.exec(
                {
                    sql: `
                       SELECT * FROM myTable WHERE age>=${minAge}
                    `,
                    callback: (x) => {
                        console.log('callback:');
                        console.dir(x);
                        res(x);
                    },
                    rowMode: 'object'
                });
        });
        console.log('result:');
        console.dir(result);
        return result;
    }
}
function sqlite3Worker1Promiser(arg0: { onready: () => void; }) {
    throw new Error('Function not implemented.');
}

