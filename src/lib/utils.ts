import { Transaction, SignedTransaction, Serializer, Action, APIClient, ABI } from "@wharfkit/session"

export async function get_abi(rpc: APIClient, account: string) {
    const response = await rpc.v1.chain.get_abi(account);
    if ( !response.abi ) throw new Error(`no abi for ${account}`);
    return response.abi;
}

export function get_type( abi: ABI.Def, action: string ) {
    for ( const action_result of abi.action_results ) {
        if ( action_result.name === action ) return action_result.result_type;
    }
    throw new Error(`action ${action} has no action return value`);
}

export function decode(abi: ABI.Def, return_value_hex_data: string, action: string) {
    const type: any = get_type(abi, action);
    const decoded = Serializer.decode({data: return_value_hex_data, type, abi});
    if ( decoded.toJSON ) return decoded.toJSON();
    if ( typeof decoded === "string" ) return decoded;
    if ( typeof decoded === "number" ) return decoded;
    if ( Array.isArray(decoded) ) return decoded;
    const keys = Object.keys(decoded);
    const json: any = {};
    for ( const key of keys ) {
        try {
            json[key] = decoded[key].toJSON();
        } catch (e) {
            json[key] = decoded[key];
        }
    }
    return json;
}

export function create_action( abi: ABI.Def, account: string, name: string, data: any ) {
    return Action.from({
        account,
        name,
        authorization: [],
        data,
    }, abi);
}

export async function read_only( rpc: APIClient, account: string, name: string, data: any ) {
    const abi = await get_abi(rpc, account);
    const action = create_action(abi, account, name, data);
    const info = await rpc.v1.chain.get_info();
    const header = info.getTransactionHeader();
    const transaction = Transaction.from({ ...header, actions: [action] });
    const signedTransaction = SignedTransaction.from({ ...transaction });
    return rpc.v1.chain.send_read_only_transaction(signedTransaction);
}
