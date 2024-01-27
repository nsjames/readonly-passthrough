#!/usr/bin/env node

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Hono } from 'hono'
import swaggerHtml from "./swagger/index.html";
import swaggerFavicon from "./swagger/favicon.png";
import { openapi } from './src/openapi.js';
import { decode, get_abi, read_only } from './src/utils.js';
import { rpcs } from './src/config.js';

const app = new Hono()
app.use('/*', cors(), logger())

app.get('/:contract/:action', async (c) => {
    const {searchParams} = new URL(c.req.url)
    let data = searchParams.get('data') ?? ''; // optional JSON encoded data
    const network = searchParams.get('network') ?? 'mainnet';
    try {
        data = JSON.parse(data);
    } catch (e) {
        // ignore
    }
    const contract = c.req.param("contract");
    const action = c.req.param("action");

    if ( !["mainnet","testnet"].includes(network)) return c.json({error: 'network must be mainnet or testnet'});
    if ( !action ) return c.json({error: 'action is required'});
    if ( !contract ) return c.json({error: 'contract is required'});
    try {
        const response = await handle_response(contract, action, data, network);
        return c.text(response);
    } catch (e) {
        return c.json({error: e.message});
    }
})

app.post('/:contract/:action', async (c) => {
    // const data = c.body; // optional JSON encoded data
    let data = await c.req.json() ?? {};
    try {
        data = JSON.parse(data);
    } catch (e) {
        // ignore
    }
    const contract = c.req.param("contract");
    const action = c.req.param("action");
    const network = c.req.raw.headers.get('x-network') ?? "mainnet";
    if ( !["mainnet","testnet"].includes(network)) return c.json({error: 'network must be mainnet or testnet'});
    if ( !action ) return c.json({error: 'action is required'});
    if ( !contract ) return c.json({error: 'contract is required'});
    try {
        const response = await handle_response(contract, action, data, network);
        return c.text(response);
    } catch (e) {
        return c.json({error: e.message});
    }
})

async function handle_response(contract: string, action: string, data: any, network: string) {
    console.log('handle_response', {contract, action, data, network});
    const rpc = rpcs[network];
    const abi = await get_abi(rpc, contract);
    const value = await read_only(abi, rpc, contract, action, data);
    const return_value_hex_data = value.processed.action_traces[0].return_value_hex_data;
    return decode(abi, return_value_hex_data, action)
}

app.get('/', async (c) => {
    return new Response(Bun.file(swaggerHtml));
})

app.get('/favicon.png', async () => {
    return new Response(Bun.file(swaggerFavicon));
})

app.get('/openapi', async (c) => {
    return c.json(JSON.parse(await openapi()));
})

export default app