import { FeeDefaults, CurrencyUnit, ICoinProtocol } from '../ICoinProtocol'
import { NonExtendedProtocol } from '../NonExtendedProtocol'
import { PolkadotNodeClient } from './node/PolkadotNodeClient'
import BigNumber from '../../dependencies/src/bignumber.js-9.0.0/bignumber'
import { IAirGapTransaction } from '../..'
import { PolkadotTransactionType } from './transaction/data/PolkadotTransaction'
import { UnsignedPolkadotTransaction } from '../../serializer/schemas/definitions/transaction-sign-request-polkadot'
import { SignedPolkadotTransaction } from '../../serializer/schemas/definitions/transaction-sign-response-polkadot'
import { PolkadotRewardDestination } from './staking/PolkadotRewardDestination'
import { isString } from 'util'
import { RawPolkadotTransaction } from '../../serializer/types'
import { PolkadotValidatorDetails } from './staking/PolkadotValidatorDetails'
import { PolkadotAccountController } from './account/PolkadotAccountController'
import { PolkadotTransactionController } from './transaction/PolkadotTransactionController'
import { PolkadotBlockExplorerClient } from './blockexplorer/PolkadotBlockExplorerClient'
import { PolkadotAddress } from './account/PolkadotAddress'

const BLOCK_EXPLORER_URL = 'https://polkascan.io/pre/kusama'
const BLOCK_EXPLORER_API = 'https://api-01.polkascan.io/kusama/api/v1'

export class PolkadotProtocol extends NonExtendedProtocol implements ICoinProtocol {    
    public symbol: string = 'DOT'
    public name: string = 'Polkadot'
    public marketSymbol: string = 'DOT'
    public feeSymbol: string = 'DOT'

    public decimals: number = 12;
    public feeDecimals: number = 12;
    public identifier: string = 'polkadot';

    // TODO: set better values
    public feeDefaults: FeeDefaults = {
        low: '0.01', // 10 000 000 000
        medium: '0.01',
        high: '0.01'
    }

    public units: CurrencyUnit[] = [
        {
            unitSymbol: 'DOT',
            factor: '1'
        },
        {
            unitSymbol: 'mDOT',
            factor: '0.001'
        },
        {
            unitSymbol: 'uDOT',
            factor: '0.000001'
        },
        {
            unitSymbol: 'Point',
            factor: '0.000000001'
        },
        {
            unitSymbol: 'Planck',
            factor: '0.000000000001'
        }
    ]

    public supportsHD: boolean = false
    public standardDerivationPath: string = `m/44'/354'/0'/0/0` // TODO: verify

    public addressIsCaseSensitive: boolean = false
    public addressValidationPattern: string = '^[a-km-zA-HJ-NP-Z1-9]+$' // TODO: set length?
    public addressPlaceholder: string = 'ABC...' // TODO: better placeholder?

    public blockExplorer: string = BLOCK_EXPLORER_URL

    constructor(
        readonly nodeClient: PolkadotNodeClient = new PolkadotNodeClient('https://polkadot-kusama-node-1.kubernetes.papers.tech'),
        readonly blockExplorerClient: PolkadotBlockExplorerClient = new PolkadotBlockExplorerClient(BLOCK_EXPLORER_URL, BLOCK_EXPLORER_API),
        readonly accountController: PolkadotAccountController = new PolkadotAccountController(nodeClient),
        readonly transactionController: PolkadotTransactionController = new PolkadotTransactionController(nodeClient)
    ) { super() }

    public async getBlockExplorerLinkForAddress(address: string): Promise<string> {
        return `${this.blockExplorerClient.accountInfoUrl}/${address}`
    }

    public async getBlockExplorerLinkForTxId(txId: string): Promise<string> {
        return `${this.blockExplorerClient.transactionInfoUrl}/${txId}`
    }

    public async getPublicKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
        const keyPair = await this.accountController.createKeyPairFromMnemonic(mnemonic, derivationPath, password)
        return keyPair.publicKey.toString('hex')
    }
    
    public async getPrivateKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<Buffer> {
        const keyPair = await this.accountController.createKeyPairFromMnemonic(mnemonic, derivationPath, password)
        return keyPair.privateKey
    }

    public async getPublicKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
        const keyPair = await this.accountController.createKeyPairFromHexSecret(secret, derivationPath)
        return keyPair.publicKey.toString('hex')
    }

    public async getPrivateKeyFromHexSecret(secret: string, derivationPath: string): Promise<Buffer> {
        const keyPair = await this.accountController.createKeyPairFromHexSecret(secret, derivationPath)
        return keyPair.privateKey
    }

    public async getAddressFromPublicKey(publicKey: string): Promise<string> {
        return this.accountController.createAddress(publicKey)
    }
    
    public async getAddressesFromPublicKey(publicKey: string): Promise<string[]> {
        return [await this.getAddressFromPublicKey(publicKey)]
    }
    
    public async getTransactionsFromPublicKey(publicKey: string, limit: number, offset: number): Promise<IAirGapTransaction[]> {
        const addresses = await this.getAddressesFromPublicKey(publicKey)
        return this.getTransactionsFromAddresses(addresses, limit, offset)
    }
    
    public async getTransactionsFromAddresses(addresses: string[], limit: number, offset: number): Promise<IAirGapTransaction[]> {
        const pageNumber = Math.ceil(offset / limit) + 1
        const txs = await Promise.all(addresses.map(address => this.blockExplorerClient.getTransactions(address, limit, pageNumber)))

        return txs
            .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
            .map(tx => ({
                protocolIdentifier: this.identifier,
                from: [],
                to: [],
                isInbound: false,
                amount: '',
                fee: '',
                ...tx
            }))
    }
    
    public async signWithPrivateKey(privateKey: Buffer, rawTransaction: RawPolkadotTransaction): Promise<string> {
        const txs = this.transactionController.decodeDetails(rawTransaction.encoded)
        const signed = await Promise.all(txs.map(tx => this.transactionController.signTransaction(privateKey, tx.transaction, tx.payload)))

        txs.forEach((tx, index) => tx.transaction = signed[index])

        return this.transactionController.encodeDetails(txs)
    }
    
    public async getTransactionDetails(transaction: UnsignedPolkadotTransaction): Promise<IAirGapTransaction[]> {
        return this.getTransactionDetailsFromEncoded(transaction.transaction.encoded)
    }
    
    public async getTransactionDetailsFromSigned(transaction: SignedPolkadotTransaction): Promise<IAirGapTransaction[]> {
        return this.getTransactionDetailsFromEncoded(transaction.transaction)
    }

    public async getBalanceOfAddresses(addresses: string[]): Promise<string> {
        const balances = await Promise.all(addresses.map(address => this.accountController.getBalance(address)))
        const balance = balances.reduce((current: BigNumber, next: BigNumber) => current.plus(next))

        return balance.toString(10)
    }

    public async getBalanceOfPublicKey(publicKey: string): Promise<string> {
        return this.getBalanceOfAddresses([await this.getAddressFromPublicKey(publicKey)])        
    }

    public async getTransferFeeEstimate(publicKey: string, destination: string, value: string, tip: string = '0'): Promise<string> {
        const transaction = await this.transactionController.createTransaction(PolkadotTransactionType.TRANSFER, publicKey, tip, { 
            to: destination.length > 0 ? destination : publicKey,
            value: new BigNumber(value) 
        })
        const fee = await this.transactionController.calculateTransactionFee(transaction)

        if (!fee) {
            return Promise.reject('Could not fetch all necessary data.')
        }

        return fee.toString(10)
    }

    public async prepareTransactionFromPublicKey(
        publicKey: string, 
        recipients: string[], 
        values: string[], 
        fee: string, 
        data?: any
    ): Promise<RawPolkadotTransaction> {
        if (recipients.length !== values.length) {
            return Promise.reject('Recipients length doesn\'t match values length.')
        }

        const recipientsWithValues: [string, string][] = recipients.map((recipient, index) => [recipient, values[index]])

        const currentBalance = await this.getBalanceOfPublicKey(publicKey)
        const totalValue = values.map(value => new BigNumber(value)).reduce((total, next) => total.plus(next), new BigNumber(0))
        const available = new BigNumber(currentBalance).minus(totalValue)

        const encoded = await this.transactionController.prepareSubmittableTransactions(
            publicKey,
            new BigNumber(currentBalance),
            recipientsWithValues.map(([recipient, value]: [string, string], index) => ({
                type: PolkadotTransactionType.TRANSFER,
                currentBalance: available,
                tip: 0, // temporary, until we handle Polkadot fee/tip model
                args: {
                    to: recipient,
                    value: new BigNumber(value)
                }
            }))
        )

        return { encoded }
    }

    public async broadcastTransaction(encoded: string): Promise<string> {
        const txs = this.transactionController.decodeDetails(encoded).map(tx => tx.transaction)

        try {
            const txHashes = await Promise.all(
                txs.map((tx, index) => this.nodeClient.submitTransaction(tx.encode()).catch(error => {
                    error.index = index
                    throw error
                }))
            )
            return txHashes[0]
        } catch (error) {
            console.warn(`Transaction #${error.index} submit failure`, error)
            return Promise.reject(`Error while submitting transaction #${error.index}: ${PolkadotTransactionType[txs[error.index].type]}.`)
        }
    }
    
    private async getTransactionDetailsFromEncoded(encoded: string): Promise<IAirGapTransaction[]> {
        const txs = this.transactionController.decodeDetails(encoded)

        return txs.map(tx => ({
            from: [],
            to: [],
            amount: '',
            fee: tx.fee.toString(),
            protocolIdentifier: this.identifier,
            isInbound: false,
            ...tx.transaction.toAirGapTransaction()
        }))
    }

    // Delegation

    public async prepareBondTransaction(
        publicKey: string,
        controller: string, 
        value: string | number | BigNumber, 
        payee: string | PolkadotRewardDestination, 
        tip: string | number | BigNumber = 0
    ): Promise<RawPolkadotTransaction> {
        const currentBalance = await this.getBalanceOfPublicKey(publicKey)
        const available = new BigNumber(currentBalance).minus(value)

        const encoded = await this.transactionController.prepareSubmittableTransactions(publicKey, available, [
            {
                type: PolkadotTransactionType.BOND,
                tip,
                args: {
                    controller,
                    value: BigNumber.isBigNumber(value) ? value : new BigNumber(value),
                    payee: isString(payee) ? PolkadotRewardDestination[payee] :  payee
                }
            }
        ])

        return { encoded }
    }

    public async prepareUnbondTransaction(
        publicKey: string, 
        value: string | number | BigNumber, 
        tip: string | number | BigNumber = 0
    ): Promise<RawPolkadotTransaction> {
        const currentBalance = await this.getBalanceOfPublicKey(publicKey)
        const available = new BigNumber(currentBalance).minus(value)

        const encoded = await this.transactionController.prepareSubmittableTransactions(publicKey, available, [
            {
                type: PolkadotTransactionType.UNBOND,
                tip,
                args: {
                    value: BigNumber.isBigNumber(value) ? value : new BigNumber(value)
                }
            }
        ])

        return { encoded }
    }

    public async prepareNominateTransaction(publicKey: string, targets: string[], tip: string | number | BigNumber = 0): Promise<RawPolkadotTransaction> {
        const currentBalance = await this.getBalanceOfPublicKey(publicKey)

        const encoded = await this.transactionController.prepareSubmittableTransactions(publicKey, currentBalance, [
            {
                type: PolkadotTransactionType.BOND,
                tip,
                args: { targets }
            }
        ])

        return { encoded }
    }

    public async prepareStopNominatingTransaction(publicKey: string, tip: string | number | BigNumber = 0): Promise<RawPolkadotTransaction> {
        const currentBalance = await this.getBalanceOfPublicKey(publicKey)

        const encoded = await this.transactionController.prepareSubmittableTransactions(publicKey, currentBalance, [
            {
                type: PolkadotTransactionType.STOP_NOMINATING,
                tip,
                args: {}
            }
        ])

        return { encoded }
    }

    public async isPublicKeyDelegating(publicKey: string): Promise<boolean> {
        return this.accountController.isDelegating(publicKey)
    }

    public getValidatorDetails(validator: string): Promise<PolkadotValidatorDetails> {
        return this.nodeClient.getValidatorDetails(PolkadotAddress.fromEncoded(validator).getBufferPublicKey())
    }

    public signMessage(message: string, privateKey: Buffer): Promise<string> {
        throw new Error('Method not implemented.');
    }
    
    public verifyMessage(message: string, signature: string, publicKey: Buffer): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}