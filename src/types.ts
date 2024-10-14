import type { MaybePromise } from 'rxdb';


export type TestDoc = {
    id: string;
    age: number;
    longtext: string;
    nes: {
        ted: number;
    },
    list: {
        value: string;
    }[];
};


export interface Tech {
    name: string;

    init: () => Promise<void>;
    clear: () => Promise<void>;
    writeDocs: (docs: TestDoc[]) => Promise<any>;
    findDocs: (ids: string[]) => Promise<TestDoc[]>;
    queryRegex: (regex: string) => Promise<TestDoc[]>;
    queryIndex: (minAge: number) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: string, minAge: number) => Promise<TestDoc[]>;
};



export type WorkerMessage = {
    id: string;
    functionName: string;
    params: any[];

    // only on answers
    result?: any;
};



/**
 * Typescript does not yet know about createSyncAccessHandle()
 */
export type FileSystemSyncAccessHandle = {
    write(data: Uint8Array, options: { at: number; }): MaybePromise<void>;
    read: (buffer: Uint8Array, opts: any) => any;
    truncate(len: number): MaybePromise<void>;
    getSize: () => Promise<number>;
    flush(): MaybePromise<void>;
    close(): MaybePromise<void>;
};
