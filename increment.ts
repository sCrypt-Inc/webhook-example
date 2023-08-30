import { WebhookExample } from './src/contracts/webhookExample'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    Scrypt,
    ContractId,
    MethodCallOptions,
} from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

Scrypt.init({
    apiKey: process.env.SCRYPT_API_KEY || '',
    network: bsv.Networks.testnet,
})

const contract_id: ContractId = {
    txId: '8fafe265099f8e8db716eee6b2191b3b7d2f84c96762f9b1031e66d91b2dad03',
    outputIndex: 0,
}

async function main() {
    await WebhookExample.compile()

    const prevInstance = await Scrypt.contractApi.getLatestInstance(
        WebhookExample,
        contract_id
    )

    await prevInstance.connect(signer)

    // 1. build a new contract instance
    const newWebhookExample = prevInstance.next()
    // 2. apply the updates on the new instance.
    newWebhookExample.increment()
    // 3. construct a transaction for contract call
    const { tx: callTx, atInputIndex } =
        await prevInstance.methods.incrementOnChain({
            next: {
                instance: newWebhookExample,
                balance: 1,
            },
        } as MethodCallOptions<WebhookExample>)

    console.log('WebhookExample contract called: ', callTx.id)
}

main()
