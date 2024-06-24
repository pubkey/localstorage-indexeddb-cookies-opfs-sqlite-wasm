import { randomString } from 'async-test-util';
import { Tech, TestDoc } from '../types';
import { batchArray, appendToArray } from 'rxdb/plugins/utils';
import { RxCollection, RxJsonSchema, createRxDatabase } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { TEST_DOC_SCHEMA } from '../test-data';




export class RxDBDexie implements Tech {
    public name = 'rxdb-dexie';
    public collection: RxCollection<TestDoc>;
    constructor() {

    }

    async init() {
        const db = await createRxDatabase({
            name: 'rxdb-dexie',
            storage: getRxStorageDexie()
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }

    async writeDocs(docs: TestDoc[]) {
        await this.collection.bulkInsert(docs);
    }

    async queryRegex(regex: string): Promise<TestDoc[]> {
        return this.collection.find({
            selector: {
                longtext: {
                    $regex: regex
                }
            }
        }).exec();
    }
    async queryIndex(minAge: number): Promise<TestDoc[]> {
        return this.collection.find({
            selector: {
                age: {
                    $gte: minAge
                }
            }
        }).exec();
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        return this.collection.find({
            selector: {
                age: {
                    $gte: minAge
                },
                longtext: {
                    $regex: regex
                }
            }
        }).exec();
    }


    async clear() {
        await this.collection.database.remove();
    }
};
