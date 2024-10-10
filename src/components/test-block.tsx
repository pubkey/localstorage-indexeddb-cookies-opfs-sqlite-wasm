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
                    id: 'init',
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
        <button onClick={() => runFn('insert1Mil')} disabled={!init}>insert1Mil</button>
        <button onClick={() => runFn('queryRegex')} disabled={!init}>queryRegex</button>
        <button onClick={() => runFn('queryIndex')} disabled={!init}>queryIndex</button>
        <button onClick={() => runFn('queryRegexIndex')} disabled={!init}>queryRegexIndex</button>
        <button onClick={() => runFn('latencyTest')} disabled={!init}>latencyTest</button>
        <button onClick={() => runFn('parallelQueries')} disabled={!init}>parallelQueries</button>
        <button onClick={() => runFn('clear')} disabled={!init}>clear</button>
    </div>;
}
