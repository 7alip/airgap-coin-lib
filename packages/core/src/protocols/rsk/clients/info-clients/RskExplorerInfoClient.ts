import Axios from '../../../../dependencies/src/axios-0.19.0/index'
import { BigNumber } from '../../../../dependencies/src/bignumber.js-9.0.0/bignumber'
import { isArray } from '../../../../dependencies/src/validate.js-0.13.1/validate'
import { AirGapTransactionStatus, IAirGapTransaction } from '../../../../interfaces/IAirGapTransaction'
import { RskProtocol } from '../../RskProtocol'
import { BLOCK_EXPLORER_API } from '../../RskProtocolOptions'
import { RskTransactionCursor, RskTransactionResult } from '../../RskTypes'

import { RskInfoClient } from './InfoClient'
import { NetworkError } from '../../../../errors'
import { Domain } from '../../../../errors/coinlib-error'

export class RskExplorerInfoClient extends RskInfoClient {
  constructor(baseURL: string = BLOCK_EXPLORER_API) {
    super(baseURL)
  }

  public async fetchTransactions(
    protocol: RskProtocol,
    address: string,
    limit: any,
    cursor?: RskTransactionCursor
  ): Promise<RskTransactionResult> {
    const airGapTransactions: IAirGapTransaction[] = []

    const url = cursor
      ? `${this.baseURL}/api?module=account&action=txlist&address=${address}&page=${cursor.page}&offset=${limit}&sort=desc`
      : `${this.baseURL}/api?module=account&action=txlist&address=${address}&page=1&offset=${limit}&sort=desc`

    const response = await Axios.get(url)
    const transactionResponse = response.data
    const transactions = transactionResponse.result
    if (transactionResponse.status === '0' && (transactions === undefined || !isArray(transactions))) {
      throw new NetworkError(Domain.RSK, { response })
    }
    for (const transaction of transactions) {
      const fee: BigNumber = new BigNumber(transaction.gas).times(new BigNumber(transaction.gasPrice))
      const airGapTransaction: IAirGapTransaction = {
        hash: transaction.hash,
        from: [transaction.from],
        to: [transaction.to],
        isInbound: transaction.to.toLowerCase() === address.toLowerCase(),
        amount: new BigNumber(transaction.value).toString(10),
        fee: fee.toString(10),
        blockHeight: transaction.blockNumber,
        protocolIdentifier: protocol.identifier,
        network: protocol.options.network,
        timestamp: parseInt(transaction.timeStamp, 10),
        status:
          transaction.txreceipt_status === undefined || transaction.txreceipt_status === '1'
            ? AirGapTransactionStatus.APPLIED
            : AirGapTransactionStatus.FAILED
      }

      airGapTransactions.push(airGapTransaction)
    }

    return {
      transactions: airGapTransactions,
      cursor: {
        page: cursor ? cursor.page : 1
      }
    }
  }

  public async fetchContractTransactions(
    protocol: RskProtocol,
    contractAddress: string,
    address: string,
    limit: number,
    cursor?: RskTransactionCursor
  ): Promise<RskTransactionResult> {
    const airGapTransactions: IAirGapTransaction[] = []

    const url = `${this.baseURL}/api?module=account&action=tokentx&address=${address}&contractaddress=${contractAddress}`

    const response = await Axios.get(url)
    const transactionResponse = response.data
    const transactions = transactionResponse.result.filter((tx) => tx.contractAddress.toLowerCase() === contractAddress.toLowerCase())
    if (transactionResponse.status === '0' && (transactions === undefined || !isArray(transactions))) {
      throw new NetworkError(Domain.RSK, { response })
    }
    for (const transaction of transactions) {
      const fee: BigNumber = new BigNumber(transaction.gas).times(new BigNumber(transaction.gasPrice))
      const airGapTransaction: IAirGapTransaction = {
        hash: transaction.hash,
        from: [transaction.from],
        to: [transaction.to],
        isInbound: transaction.to.toLowerCase() === address.toLowerCase(),
        blockHeight: transaction.blockNumber,
        protocolIdentifier: protocol.identifier,
        network: protocol.options.network,
        amount: new BigNumber(transaction.value).toString(10),
        fee: fee.toString(10),
        timestamp: parseInt(transaction.timeStamp, 10),
        status:
          transaction.txreceipt_status === undefined || transaction.txreceipt_status === '1'
            ? AirGapTransactionStatus.APPLIED
            : AirGapTransactionStatus.FAILED
      }

      airGapTransactions.push(airGapTransaction)
    }

    return {
      transactions: airGapTransactions,
      cursor: {
        page: cursor ? cursor.page : 1
      }
    }
  }
}