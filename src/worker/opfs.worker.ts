import { OPFSInsideOfWorker } from '../tech/opfs';
import type { WorkerMessage } from '../types';



const instance = new OPFSInsideOfWorker();



const firstInitMessage: WorkerMessage = {
    id: 'first',
    functionName: '',
    params: []
};
postMessage(firstInitMessage);


self.onmessage = async (event: MessageEvent) => {
    const message: WorkerMessage = event.data;
    const fn = instance[message.functionName];
    const result = await fn.bind(instance)(
        message.params[0],
        message.params[1],
        message.params[2],
        message.params[3]
    );
    const answer: WorkerMessage = {
        id: message.id,
        functionName: message.functionName,
        params: [],
        result
    };
    postMessage(answer);
};
