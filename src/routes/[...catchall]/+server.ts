import "isomorphic-fetch";
import {JsSignatureProvider} from "enf-eosjs/dist/eosjs-jssig";
import {Api, JsonRpc} from "enf-eosjs";
import {Buffer} from "buffer";

const defaultPrivateKey = "5JPxfTRgiLKJgYkFjAtrRMF15xcTUgTzFSh1cjgdAvJYRX9SWHF";
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);




const NETWORKS = {
    'mainnet': 'https://eos.greymass.com',
    'testnet': 'https://jungle4.cryptolions.io',
}
export const config = {
    // Use 'nodejs18.x' for Serverless
    runtime: 'edge',
};

// json: sj5wyvn1azme/get
// text: t53ryjs2mw1d/get
// html: sk3bjrendfhx/get
// user-specified: n1c344mpfpbe/get

const getReadOnlyResult = async (network:string|null, contract: string, action: string, data: any|null) => {
    let _network = null;

    if(!network) {
        _network = NETWORKS.mainnet;
    } else {
        if(network.startsWith('http')) {
            _network = network;
        } else {
            _network = NETWORKS[network];
            if(!_network) return null;
        }
    }

    const rpc = new JsonRpc(_network);
    const api = new Api({ rpc, signatureProvider });

    let _data = {};
    if(data) {
        try {
            if(typeof data === 'string') {
                console.log('_data', decodeURI(data));
                _data = JSON.parse(decodeURI(data))
            } else {
                _data = data;
            }
        } catch(e) {
            console.error('error parsing data', e);
            return null;
        }
    }

    const result = await api.transact({
        actions: [{
            account: contract,
            name: action,
            authorization: [],
            data: _data,
        }]
    }, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast: false,
    }).catch((e) => {
        console.error('error 1', e, contract, action);
    });
    const readonlyResult = await api.sendReadonlyTransaction({
        signatures: [],
        serializedTransaction: result.serializedTransaction,
        serializedContextFreeData: result.serializedContextFreeData,
    }).catch((e) => {
        console.error('error 2', e);
        return null;
    });


    if(readonlyResult) {
        const returnValueHexes = readonlyResult.processed.action_traces[0].return_value_hex_data;
        if(!returnValueHexes) return null;

        const returnValue = Buffer.from(returnValueHexes, 'hex').toString('utf8');
        let resultString = "";
        // TODO: Fix this hack later to properly handle hex conversion using ABIs (jungle not supporting)
        for(let i = 0; i < returnValue.length; i++) {
            if(returnValue.charCodeAt(i) <= 31) {
                continue;
            }

            if(returnValue.charCodeAt(i) >= 5000) {
                continue;
            }

            resultString += returnValue[i];
        }

        return resultString;
    }
    return null;
}

const inferContentType = (content: string|null) => {
    if (!content) return 'text/plain';

    // check if has user-specific content type
    if (content.startsWith('data:') && content.includes(';')) {
        return content.split(';')[0].substring(5);
    }

    // application/json
    if ((content.startsWith('{') && content.endsWith('}')) || (content.startsWith('[') && content.endsWith(']'))) {
        return 'application/json';
    }

    // text/html
    if (content.toUpperCase().startsWith('<!DOCTYPE HTML>')) {
        return 'text/html';
    }

    // TODO: Find a way to infer more types, might need to have the contract specify it

    return 'text/plain';
}

export async function GET(event): Promise<any> {
    const [contract, action, data] = event.params.catchall.split('/');
    const headers = event.request.headers;
    const network = event.url.searchParams.get('network') || headers.get('x-network');

    const result = await getReadOnlyResult(network, contract, action, data);

    return new Response(result, {
        headers: {
            'Content-Type': inferContentType(result),
        },
        status: 200,
    })
}

export async function POST(event): Promise<any> {
    const [contract, action] = event.params.catchall.split('/');
    const headers = event.request.headers;
    const network = event.url.searchParams.get('network') || headers.get('x-network');

    const data = await event.request.json();
    const result = await getReadOnlyResult(network, contract, action, data);

    return new Response(result, {
        headers: {
            'Content-Type': inferContentType(result),
        },
        status: 200,
    })
}
