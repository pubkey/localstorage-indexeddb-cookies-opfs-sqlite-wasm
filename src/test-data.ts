import { randomNumber, randomString, wait } from 'async-test-util';
import { TestDoc } from './types';

export function createTestDoc(): TestDoc {
    return {
        id: randomString(12),
        age: randomNumber(0, 100),
        list: [],
        longtext: randomString(1000),
        nes: {
            ted: randomNumber(0, 100)
        }
    }
}


export async function createTestDocs(amount: number): Promise<TestDoc[]> {
    console.log('createTestDocs(' + amount + ')');


    const ret: TestDoc[] = [];
    let t = amount;
    while (t > 0) {
        t--;
        ret.push(createTestDoc());
        if (t % 5000 === 0) {
            console.log('wait');
            await wait(0);
        }
    }

    console.log('createTestDocs(' + amount + ') DONE');
    return ret;
}
