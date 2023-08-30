import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { ContractId, DefaultProvider, Scrypt, bsv } from 'scrypt-ts'
import { WebhookExample } from './contracts/webhookExample'
WebhookExample.compile()

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

Scrypt.init({
    apiKey: process.env.SCRYPT_API_KEY || '',
    network: bsv.Networks.testnet,
})

const contract_id: ContractId = {
    txId: '8fafe265099f8e8db716eee6b2191b3b7d2f84c96762f9b1031e66d91b2dad03',
    outputIndex: 0,
}

// Declare a mutable global variable to store latest contract instance
let latestInstance: WebhookExample = undefined

const app = express()

// Middleware to parse JSON requests
app.use(bodyParser.json())

async function init() {
    latestInstance = await Scrypt.contractApi.getLatestInstance(
        WebhookExample,
        contract_id
    )
}

app.post('/event', async (req: Request, res: Response) => {
    try {
        const events = req.body.events

        if (events && events.length > 0) {
            const utxoSpentEvent = events.find(
                (event) => event.eventType === 'utxoSpent'
            )

            if (utxoSpentEvent && utxoSpentEvent.spentBy) {
                // Parse out method call TXID from request payload.
                const txId = utxoSpentEvent.spentBy.txId

                // Retrieve the full serialized transaction using a provider.
                const provider = new DefaultProvider({
                    network: bsv.Networks.testnet,
                })
                const tx = await provider.getTransaction(txId)

                // Reconstruct latest contract instance from serialized tx.
                latestInstance = WebhookExample.fromTx(tx, 0)

                return res.send('Success.')
            }
        }

        res.status(400).send('Invalid data format')
    } catch (error) {
        console.error('An error occurred:', error)
        res.status(500).send('Internal Server Error')
    }
})

app.get('/getCounter', (req: Request, res: Response) => {
    res.send({ count: latestInstance.count.toString() })
})

const PORT = parseInt(process.env.PORT as string, 10) || 3000
init().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is listening on http://0.0.0.0:${PORT}`)
    })
})
