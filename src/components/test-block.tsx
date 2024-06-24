import * as React from "react";
import { Tech, TestDoc } from '../types';
import { createTestDoc } from '../test-data';

export function TestBlock(props) {
    const tech: Tech = props.tech;
    const writeDocsAmount: number = props.writeAmount;
    const testData: Promise<TestDoc[]> = props.testData;



    async function runFn(
        fnName: keyof Tech
    ) {
        let startTime = performance.now();
        console.dir(props);
        switch (fnName) {
            case 'init':
                await tech.init();
                await tech.queryIndex(props.minAge);
                break;
            case 'writeDocs':
                console.log('writing ' + writeDocsAmount + ' docs...');
                await tech.writeDocs(await testData);
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
        <button onClick={() => runFn('writeDocs')}>writeDocs</button>
        <button onClick={() => runFn('queryRegex')}>queryRegex</button>
        <button onClick={() => runFn('queryIndex')}>queryIndex</button>
        <button onClick={() => runFn('queryRegexIndex')}>queryRegexIndex</button>
        <button onClick={() => runFn('clear')}>clear</button>
    </div>;
}
