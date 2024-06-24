
import * as React from "react";
import { ProcessBlockIndicator } from './components/spinner';
import { createRoot } from 'react-dom/client';

import { IndexedDBCursor, IndexedDBBulk } from './tech/indexeddb';
import { Localstorage } from './tech/localstorage';

import { TestBlock } from './components/test-block';
import { Tech } from './types';
import { createTestDocs } from './test-data';
import {
    WasmSQLiteMainThread,
    WASQLiteIndexedDB,
    WASQLiteMemory,
    WASQLiteOPFS
} from './tech/wasm-sqlite';
import { Cookies } from './tech/cookies';
import { RxDBDexie } from './tech/rxdb';


const techs: Tech[] = [
    new IndexedDBCursor(),
    new IndexedDBBulk(),
    new WASQLiteMemory(),
    new WASQLiteIndexedDB(),
    new Localstorage(),
    new Cookies(),
    new RxDBDexie()

    // new WasmSQLiteMainThread(),
    // new WASQLiteOPFS() // TODO wait for new wa-sqlite release
]

function App() {
    const [writeAmount, setWriteAmount] = React.useState(10000);
    const [regex, setRegex] = React.useState('foobar');
    const [minAge, setMinAge] = React.useState(50);


    const [testData, setTestData] = React.useState([]);

    function handleWriteAmountChange(e) {
        console.log('handleWriteAmountChange()');
        const newAmount = parseInt(e.target.value, 10);
        setWriteAmount(newAmount);
    }
    return <>
        WriteAmount ({writeAmount}): <input type="number" value={writeAmount} onChange={handleWriteAmountChange} />
        <button onClick={() => setTestData(createTestDocs(writeAmount))}>Submit</button>
        <br />
        <br />
        <ProcessBlockIndicator></ProcessBlockIndicator>
        <br />
        <div>
            {
                techs.map(tech => <TestBlock
                    key={tech.name}
                    tech={tech}
                    writeAmount={writeAmount}
                    regex={regex}
                    minAge={minAge}
                    testData={testData}
                ></TestBlock>)
            }
        </div>
        <br />
    </>
        ;
}

const root = createRoot(document.getElementById("app"));
root.render(
    <App />
);






