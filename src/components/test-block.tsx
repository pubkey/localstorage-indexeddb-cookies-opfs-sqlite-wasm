import * as React from "react";
import { Tech, TestDoc } from '../types';
import { createTestDoc, createTestDocs } from '../test-data';
import { randomString } from 'async-test-util';

export function TestBlock(props) {
    const tech: Tech = props.tech;
    const writeDocsAmount: number = props.writeAmount;
    const testData: Promise<TestDoc[]> = props.testData;


    const [init, setInit] = React.useState(false);

    async function runFn(
        fnName: string
    ) {
        let startTime = performance.now();
        console.dir(props);
        switch (fnName) {
            case 'init':
                await tech.init();
                await tech.writeDocs([{
                    age: 1,
                    id: 'init_' + new Date().getTime(),
                    list: [],
                    longtext: '',
                    nes: {
                        ted: 1
                    }
                }]);
                // await tech.queryIndex(10000);
                setInit(true);
                break;
            case 'writeDocs':
                console.log('writing ' + writeDocsAmount + ' docs...');
                await tech.writeDocs(await testData);
                break;
            case 'latencyOfSmallWrites':
                const amount = 100;
                const latencyDocs = await createTestDocs(amount);
                console.log('writing ' + amount + ' docs...');
                const start = performance.now();
                for (let i = 0; i < latencyDocs.length; i++) {
                    const doc = latencyDocs[i];
                    await tech.writeDocs([doc]);
                }
                const total = performance.now() - start;
                const perWrite = total / amount;
                console.log('latencyOfSmallWrites inner time perWrite: ' + perWrite);
                await tech.clear();
                break;
            case 'latencyOfSmallReads':
                const readAmount = 10;
                const readLatencyDocs = await createTestDocs(readAmount);
                console.log('writing ' + readAmount + ' docs...');
                await tech.writeDocs(readLatencyDocs);
                const ids = readLatencyDocs.map(d => d.id);
                const startT = performance.now();
                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    await tech.findDocs([id]);
                }
                const totalT = performance.now() - startT;
                const perWriteT = totalT / readAmount;
                console.log('latencyOfSmallReads inner time perRead: ' + perWriteT);
                await tech.clear();
                break;
            case 'latencyOfBulkWrites':
                await (async () => {
                    const amount = 200;
                    const latencyDocs = await createTestDocs(amount);
                    console.log('writing ' + amount + ' docs...');
                    const start = performance.now();
                    await tech.writeDocs(latencyDocs);
                    const total = performance.now() - start;
                    console.log('latencyOfBulkWrites inner time: ' + total);
                    await tech.clear();
                })();
                break;
            case 'latencyOfBulkReads':
                await (async () => {
                    const amount = 100;
                    const latencyDocs = await createTestDocs(amount);
                    console.log('writing ' + amount + ' docs...');
                    await tech.writeDocs(latencyDocs);
                    const ids = latencyDocs.map(d => d.id);
                    const start = performance.now();
                    const read = await tech.findDocs(ids);
                    const total = performance.now() - start;

                    console.log('latencyOfBulkReads inner time: ' + total);
                    await tech.clear();
                })();
                break;
            case 'bulkinsertknown':
                await (async () => {
                    const amount = 100;
                    const latencyDocs = await createTestDocs(amount);
                    console.log('writing ' + amount + ' docs...');

                    const docs = latencyDocs.map((d, i) => {
                        d.id = i + '';
                        return d;
                    });

                    const start = performance.now();
                    await tech.writeDocs(docs);
                    const total = performance.now() - start;

                    console.log('latencyOfBulkReads inner time: ' + total);
                })();
                break;
            case 'bulkreadknown':
                await (async () => {
                    const amount = 100;
                    const latencyDocs = await createTestDocs(amount);
                    console.log('writing ' + amount + ' docs...');

                    const docs = latencyDocs.map((d, i) => {
                        d.id = i + '';
                        return d;
                    });
                    const ids = latencyDocs.map(d => d.id);

                    const start = performance.now();
                    await tech.findDocs(ids);
                    const total = performance.now() - start;

                    console.log('latencyOfBulkReads inner time: ' + total);
                })();
                break;
            case 'smallreadknown':
                await (async () => {
                    const amount = 100;
                    const latencyDocs = await createTestDocs(amount);
                    console.log('writing ' + amount + ' docs...');

                    const docs = latencyDocs.map((d, i) => {
                        d.id = i + '';
                        return d;
                    });
                    const ids = docs.map(d => d.id);

                    const start = performance.now();
                    for (let i = 0; i < ids.length; i++) {
                        const id = ids[i];
                        await tech.findDocs([id]);
                    }
                    const total = performance.now() - start;

                    const perDoc = total / ids.length;

                    console.log('smallreadknown inner time perDoc: ' + perDoc);
                })();
                break;
            case 'insert1Mil':
                console.log('insert1Mil docs...');
                const batchSize = writeDocsAmount;
                let docsWritten = 0;
                while (docsWritten < 1000000) {
                    console.log('create test data ' + docsWritten);
                    const docsData = await createTestDocs(batchSize);
                    console.log('start insert');
                    const start = performance.now();
                    await tech.writeDocs(docsData);
                    const end = performance.now();
                    const writeTime = end - start;
                    console.log('write done in ' + writeTime + 'ms');
                    docsWritten += batchSize;
                }

                // run a query to ensure WAL mode etc is processed
                await tech.queryIndex(10000);
                break;
            case 'queryRegex':
                const docs1 = await tech.queryRegex(props.regex);
                console.log('docs.length: ' + docs1.length);
                break;
            case 'queryIndex':
                const docs2 = await tech.queryIndex(props.minAge);
                console.log('docs.length: ' + docs2.length);
                console.dir(docs2);
                break;
            case 'queryRegexIndex':
                const docs = await tech.queryRegexIndex(props.regex, props.minAge);
                console.log('docs.length: ' + docs.length);
                break;
            case 'latencyTest':
                let t = 0;
                while (t < 100) {
                    await tech.writeDocs([createTestDoc()]);
                    await tech.writeDocs([createTestDoc()]);
                    await tech.queryIndex(10000);
                    t++;
                }
                break;
            case 'parallelQueries':
                await Promise.all(
                    new Array(20).fill(0).map(() => tech.queryRegex(randomString(12)))
                );
                break;
            case 'clear':
                await tech.clear();
                break;

            default:
                throw new Error('fnName not implemented ' + fnName);
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        console.log('#' + tech.name + ' total time of ' + fnName + ': ' + Math.ceil(totalTime));

        console.log();

    }

    return <div className="test-block">
        <h5>{tech.name}</h5>
        <button onClick={() => runFn('init')}>Init</button>
        <button onClick={() => runFn('writeDocs')} disabled={!init}>writeDocs</button>
        <button onClick={() => runFn('latencyOfSmallWrites')} disabled={!init}>latencyOfSmallWrites</button>
        <button onClick={() => runFn('latencyOfSmallReads')} disabled={!init}>latencyOfSmallReads</button>
        <button onClick={() => runFn('latencyOfBulkWrites')} disabled={!init}>latencyOfBulkWrites</button>
        <button onClick={() => runFn('latencyOfBulkReads')} disabled={!init}>latencyOfBulkReads</button>
        <button onClick={() => runFn('bulkinsertknown')} disabled={!init}>bulkinsertknown</button>
        <button onClick={() => runFn('bulkreadknown')} disabled={!init}>bulkreadknown</button>
        <button onClick={() => runFn('smallreadknown')} disabled={!init}>smallreadknown</button>
        <button onClick={() => runFn('insert1Mil')} disabled={!init}>insert1Mil</button>
        <button onClick={() => runFn('queryRegex')} disabled={!init}>queryRegex</button>
        <button onClick={() => runFn('queryIndex')} disabled={!init}>queryIndex</button>
        <button onClick={() => runFn('queryRegexIndex')} disabled={!init}>queryRegexIndex</button>
        <button onClick={() => runFn('latencyTest')} disabled={!init}>latencyTest</button>
        <button onClick={() => runFn('parallelQueries')} disabled={!init}>parallelQueries</button>
        <button onClick={() => runFn('clear')} disabled={!init}>clear</button>
    </div>;
}
