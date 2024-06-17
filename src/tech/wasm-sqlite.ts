import { randomString } from 'async-test-util';
import { Tech, TestDoc } from '../types';
import sqlite3InitModule, { Database } from '@sqlite.org/sqlite-wasm';
const STORE_NAME = 'mystore';
const log = console.log;
const error = console.error;


export class WASQLiteMemory implements Tech {
    public name = 'wa-sqlite-memory';
    dbName: string = randomString(10);
    db: Database;
    dbNr: number;
    sqlite3: SQLiteAPI;

    constructor() {

    }
    clear: () => Promise<void>;
    writeDocs: (docs: TestDoc[]) => Promise<any>;
    queryRegex: (regex: RegExp) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: RegExp, minAge: number) => Promise<TestDoc[]>;



    async run(query, params?) {
        await this.sqlite3.run(this.dbNr, query, params);
    }
    async all(query, params?) {
        const result = await this.sqlite3.execWithParams(this.dbNr, query, params);
        return result.rows;
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

    async queryIndex(minAge: number): Promise<TestDoc[]> {
        const result = await this.all(`
            SELECT * FROM myTable WHERE age>=${minAge}
            `
        );
        console.dir(result);
        return result as any;
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
    queryRegex: (regex: RegExp) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: RegExp, minAge: number) => Promise<TestDoc[]>;


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
    queryRegex: (regex: RegExp) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: RegExp, minAge: number) => Promise<TestDoc[]>;


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

