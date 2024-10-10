import { OPFSInsideOfWorker } from '../tech/opfs';
import { FileSystemSyncAccessHandle, WorkerMessage } from '../types';



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
    const result = await fn(...message.params);


    const answer: WorkerMessage = {
        id: message.id,
        functionName: message.functionName,
        params: [],
        result
    };
    postMessage(answer);
};
