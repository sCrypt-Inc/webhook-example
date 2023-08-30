import { expect } from 'chai'
import { WebhookExample } from '../src/contracts/webhookExample'
import { getDefaultSigner } from './utils/txHelper'
import { MethodCallOptions } from 'scrypt-ts'

describe('Test SmartContract `WebhookExample`', () => {
    before(async () => {
        await WebhookExample.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        // create a genesis instance
        const counter = new WebhookExample(0n)
        // construct a transaction for deployment
        await counter.connect(getDefaultSigner())

        const deployTx = await counter.deploy(1)
        console.log('WebhookExample contract deployed: ', deployTx.id)

        let prevInstance = counter

        // multiple calls
        for (let i = 0; i < 3; i++) {
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

            // 4. run `verify` method on `prevInstance`
            const result = callTx.verifyScript(atInputIndex)

            expect(result.success, result.error).to.be.true
            console.log('WebhookExample contract called: ', callTx.id)
            // prepare for the next iteration
            prevInstance = newWebhookExample
        }
    })
})
