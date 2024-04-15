import "isomorphic-fetch";
import {JsSignatureProvider} from "enf-eosjs/dist/eosjs-jssig";
import {get_abi, read_only, decode} from "$lib/utils";

const defaultPrivateKey = "5JPxfTRgiLKJgYkFjAtrRMF15xcTUgTzFSh1cjgdAvJYRX9SWHF";
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);

import { APIClient } from "@wharfkit/session"


const NETWORKS = {
    'mainnet': 'https://eos.greymass.com',
    'testnet': 'https://jungle4.cryptolions.io',
}
export const config = {
    // Use 'nodejs18.x' for Serverless
    runtime: 'edge',
};

const getReadOnlyResult = async (network:string|null, contract: string, action: string, data: any|null) => {
    if(contract === "favicon.ico") return null;

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

    let _data = {};
    if(data) {
        try {
            if(typeof data === 'string') {
                _data = JSON.parse(decodeURI(data))
            } else {
                _data = data;
            }
        } catch(e) {
            console.error('error parsing data', e);
            return null;
        }
    }

    const rpc = new APIClient({ url: _network });
    const abi = await get_abi(rpc, contract);
    const value = await read_only(rpc, contract, action, _data);
    const return_value_hex_data = value.processed.action_traces[0].return_value_hex_data;
    return decode(abi, return_value_hex_data, action)
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
