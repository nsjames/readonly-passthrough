#!/usr/bin/env node

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Hono } from 'hono'
import swaggerHtml from "./swagger/index.html";
import swaggerFavicon from "./swagger/favicon.png";
import { openapi } from './src/openapi.js';

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
    return c.json({response: {contract, action, data, network}});
})

app.post('/:contract/:action', async (c) => {
    // const data = c.body; // optional JSON encoded data
    const data = await c.req.json();
    const contract = c.req.param("contract");
    const action = c.req.param("action");
    const network = c.req.raw.headers.get('x-network') ?? "mainnet";
    if ( !["mainnet","testnet"].includes(network)) return c.json({error: 'network must be mainnet or testnet'});
    if ( !action ) return c.json({error: 'action is required'});
    if ( !contract ) return c.json({error: 'contract is required'});
    return c.json({response: {contract, action, data, network}});
})

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