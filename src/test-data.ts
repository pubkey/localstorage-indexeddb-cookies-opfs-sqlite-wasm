import { randomNumber, randomString, wait } from 'async-test-util';
import { TestDoc } from './types';
import { RxJsonSchema } from 'rxdb';


export const TEST_DOC_SCHEMA: RxJsonSchema<TestDoc> = {
    primaryKey: 'id',
    version: 0,
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 12
        },
        age: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            multipleOf: 1
        },
        list: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string'
                    }
                }
            }
        },
        longtext: {
            type: 'string',
            maxLength: 1000
        },
        nes: {
            type: 'object',
            properties: {
                ted: {
                    type: 'string'
                }
            }
        }
    },
    additionalProperties: false,
    indexes: [
        'age'
    ]
} as const;

export function createTestDoc(): TestDoc {
    return {
        id: randomString(TEST_DOC_SCHEMA.properties.id.maxLength),
        age: randomNumber(TEST_DOC_SCHEMA.properties.age.minimum, TEST_DOC_SCHEMA.properties.age.maximum),
        list: new Array(5).fill(0).map(() => ({ value: randomString(10) })),
        longtext: randomString(TEST_DOC_SCHEMA.properties.longtext.maxLength),
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
