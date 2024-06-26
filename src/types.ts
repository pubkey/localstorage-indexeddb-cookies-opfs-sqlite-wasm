

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
    queryRegex: (regex: string) => Promise<TestDoc[]>;
    queryIndex: (minAge: number) => Promise<TestDoc[]>;
    queryRegexIndex: (regex: string, minAge: number) => Promise<TestDoc[]>;
};
