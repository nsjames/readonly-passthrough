import { APIClient } from "@wharfkit/session"

export const rpcs = {
    mainnet: new APIClient({ url: "https://eos.api.eosnation.io" }),
    testnet: new APIClient({ url: "https://jungle4.api.eosnation.io" }),
}
