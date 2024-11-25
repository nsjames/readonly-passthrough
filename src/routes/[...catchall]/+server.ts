import "isomorphic-fetch";
import {get_abi, read_only, decode} from "$lib/utils";

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
            // @ts-ignore
            _network = NETWORKS[network];
            if(!_network) return "Invalid network";
        }
    }

    const rpc = new APIClient({ url: _network });
    const abi = await get_abi(rpc, contract);

    if(Array.isArray(data)) {
        const actionAbi = abi.actions.find(x => x.name === action);
        const actionAbiFields = abi.structs.find(x => x.name === actionAbi!.type);
        const formattedData:any = {};

        let i = 0;
        for (const field of actionAbiFields!.fields) {
            try {
                formattedData[field.name] = JSON.parse(data[i]);
            } catch (e) {
                formattedData[field.name] = decodeURIComponent(data[i]);
            }
            i++;
        }

        const value = await read_only(rpc, contract, action, formattedData);
        const return_value_hex_data = value.processed.action_traces[0].return_value_hex_data;
        return decode(abi, return_value_hex_data, action)
    } else {
        const _data = JSON.parse(decodeURI(data))
        const value = await read_only(rpc, contract, action, _data);
        const return_value_hex_data = value.processed.action_traces[0].return_value_hex_data;
        return decode(abi, return_value_hex_data, action)
    }

}

const inferContentType = (content: string|null) => {
    if (!content) return 'text/plain';

    try {
        content = JSON.stringify(content);
    } catch (e) {}

    // check if has user-specific content type
    if (content.startsWith('data:') && content.includes(';')) {
        return content.split(';')[0].substring(5);
    }

    // application/json
    if ((content.startsWith('"{') && content.endsWith('}"')) || (content.startsWith('"[') && content.endsWith(']"'))) {
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
    const [contract, action, ...data] = event.params.catchall.split('/');
    const headers = event.request.headers;
    const network = event.url.searchParams.get('network') || headers.get('x-network');

    let result = await getReadOnlyResult(network, contract, action, data);
    try { result = JSON.stringify(result) } catch (e) {}

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
    let result = await getReadOnlyResult(network, contract, action, data);
    try { result = JSON.stringify(result) } catch (e) {}

    return new Response(result, {
        headers: {
            'Content-Type': inferContentType(result),
        },
        status: 200,
    })
}
