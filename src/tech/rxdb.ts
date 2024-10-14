import { randomString, wait } from 'async-test-util';
import { Tech, TestDoc } from '../types';
import { batchArray, appendToArray, clone, promiseWait, requestIdlePromise } from 'rxdb/plugins/utils';
import { MangoQuery, RxCollection, RxJsonSchema, addRxPlugin, createRxDatabase } from 'rxdb/plugins/core';
import { TEST_DOC_SCHEMA } from '../test-data';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';
import {
    getRxStorageSharding
} from 'rxdb-premium/plugins/storage-sharding';
import { RxStorageRemoteSettings } from 'rxdb/plugins/storage-remote';
import { getRxStorageWorker } from 'rxdb-premium/plugins/storage-worker';
import { getMemoryMappedRxStorage } from 'rxdb-premium/plugins/storage-memory-mapped';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
addRxPlugin(RxDBCleanupPlugin);
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
addRxPlugin(RxDBLeaderElectionPlugin);
import {
    getLocalstorageMetaOptimizerRxStorage
} from 'rxdb-premium/plugins/storage-localstorage-meta-optimizer';
const multiInstance = false;
const workerMode: RxStorageRemoteSettings['mode'] = 'collection';


export class RxDBDexie implements Tech {
    public name = 'rxdb-dexie';
    public collection: RxCollection<TestDoc>;
    constructor() { }


    /**
     * Run a plain query against the storage instance
     * instead of the RxCollection.
     * This prevents caching and other RxDB performance
     * optimizations.
     */
    private async runPlainQuery(mangoQuery: MangoQuery<TestDoc>) {
        const query = this.collection.find(mangoQuery);
        const prepared = query.getPreparedQuery();
        const result = await this.collection.storageInstance.query(
            prepared
        );
        return result.documents;
    }

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageDexie(),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }

    insertCount = 0;
    async writeDocs(docs: TestDoc[]) {
        this.insertCount = this.insertCount + docs.length;
        await this.collection.bulkInsert(docs);

        if (this.insertCount >= 200000) {
            console.log('wait for cleanup!');
            await requestIdlePromise();
            await requestIdlePromise();
            this.insertCount = 0;
        }

        // do not await the cleanup, it should me a side effect
        // promiseWait(100).then(() => this.collection.cleanup(0))
    }

    async findDocs(ids: string[]): Promise<TestDoc[]> {
        const docs = await this.collection.findByIds(ids).exec();
        return Array.from(docs.values());
    }

    async queryRegex(regex: string): Promise<TestDoc[]> {
        return this.runPlainQuery({
            selector: {
                longtext: {
                    $regex: regex
                }
            }
        });
    }
    async queryIndex(minAge: number): Promise<TestDoc[]> {
        return this.runPlainQuery({
            selector: {
                age: {
                    $gte: minAge
                }
            }
        });
    }
    async queryRegexIndex(regex: string, minAge: number): Promise<TestDoc[]> {
        return this.runPlainQuery({
            selector: {
                age: {
                    $gte: minAge
                },
                longtext: {
                    $regex: regex
                }
            }
        });
    }


    async clear() {
        await this.collection.database.remove();
    }
};



export class RxDBIndexedDB extends RxDBDexie {
    public name = 'rxdb-indexeddb';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageIndexedDB(),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }
};

export class RxDBIndexedDBWorker extends RxDBDexie {
    public name = 'rxdb-indexeddb-worker';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageWorker({
                mode: workerMode,
                workerInput: '/rxdb/indexeddb.worker.js'
            }),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }
};



export class RxDBIndexedDBSharding extends RxDBDexie {
    public name = 'rxdb-indexeddb-sharding';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageIndexedDB()
            }),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }
};


export class RxDBIndexedDBShardingWorker extends RxDBDexie {
    public name = 'rxdb-indexeddb-sharding-worker';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: '/rxdb/indexeddb.worker.js'
                })
            }),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
        await wait(0);
    }
};

export class RxDBIndexedDBMemoryMapped extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getMemoryMappedRxStorage({
                storage: getRxStorageIndexedDB()
            }),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }
};




export class RxDBIndexedDBMemoryMappedShardingWorker extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: () => {
                        console.log('create one worker!');
                        return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                    }
                })
            }),
            multiInstance
        });
        await db.addCollections({
            docs: {
                schema: TEST_DOC_SCHEMA
            }
        });
        this.collection = db.docs;
    }
};




export class RxDBIndexedDBMemoryMappedShardingWorkerDb8 extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker-database-8';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: () => {
                        console.log('create one worker!');
                        return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                    }
                })
            }),
            multiInstance
        });
        const schema = clone(TEST_DOC_SCHEMA);
        schema.sharding.shards = 8;
        schema.sharding.mode = 'database';
        await db.addCollections({
            docs: {
                schema
            }
        });
        this.collection = db.docs;
    }
};



export class RxDBIndexedDBMemoryMappedShardingWorkerDb16 extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker-database-16';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: () => {
                        console.log('create one worker!');
                        return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                    }
                })
            }),
            multiInstance
        });
        const schema = clone(TEST_DOC_SCHEMA);
        schema.sharding.shards = 16;
        schema.sharding.mode = 'database';
        await db.addCollections({
            docs: {
                schema
            }
        });
        this.collection = db.docs;
    }
};



export class RxDBIndexedDBMemoryMappedShardingWorkerDb32 extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker-database-32';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: () => {
                        console.log('create one worker!');
                        return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                    }
                })
            }),
            multiInstance
        });
        const schema = clone(TEST_DOC_SCHEMA);
        schema.sharding.shards = 32;
        schema.sharding.mode = 'database';
        await db.addCollections({
            docs: {
                schema
            }
        });
        this.collection = db.docs;
    }
};



export class RxDBIndexedDBMemoryMappedShardingWorkerDb48 extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker-database-48';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getRxStorageSharding({
                storage: getRxStorageWorker({
                    mode: workerMode,
                    workerInput: () => {
                        console.log('create one worker!');
                        return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                    }
                })
            }),
            multiInstance
        });
        const schema = clone(TEST_DOC_SCHEMA);
        schema.sharding.shards = 48;
        schema.sharding.mode = 'database';
        await db.addCollections({
            docs: {
                schema
            }
        });
        this.collection = db.docs;
    }
};

export class RxDBIndexedDBMemoryMappedShardingWorkerDb48MetaOptimized extends RxDBDexie {
    public name = 'rxdb-indexeddb-memory-mapped-sharding-worker-database-48-meta-optimized';

    async init() {
        const db = await createRxDatabase({
            name: this.name,
            storage: getLocalstorageMetaOptimizerRxStorage({
                storage: getRxStorageSharding({
                    storage: getRxStorageWorker({
                        mode: workerMode,
                        workerInput: () => {
                            console.log('create one worker!');
                            return new Worker('/rxdb/memory-mapped-indexeddb.worker.js');
                        }
                    })
                }),
            }),
            multiInstance
        });
        const schema = clone(TEST_DOC_SCHEMA);
        schema.sharding.shards = 48;
        schema.sharding.mode = 'database';
        await db.addCollections({
            docs: {
                schema
            }
        });
        this.collection = db.docs;
    }
};
