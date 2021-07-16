import { AeternityTransactionCursor } from '../protocols/aeternity/AeternityTypes'
import { EthereumTransactionCursor } from '../protocols/ethereum/EthereumTypes'
import { RskTransactionCursor } from '../protocols/rsk/RskTypes'
import { ProtocolNetwork } from '../utils/ProtocolNetwork'
import { ProtocolSymbols } from '../utils/ProtocolSymbols'

import { BitcoinBlockbookTransactionCursor, BitcoinTransactionCursor } from './../protocols/bitcoin/BitcoinTypes'
import { CosmosTransactionCursor } from './../protocols/cosmos/CosmosTypes'
import { SubstrateTransactionCursor } from './../protocols/substrate/SubstrateTypes'
import { TezosTransactionCursor } from './../protocols/tezos/types/TezosTransactionCursor'

export enum AirGapTransactionType {
  SPEND = 'Spend Transaction',
  DELEGATE = 'Delegation',
  UNDELEGATE = 'Undelegate'
}

export enum AirGapTransactionStatus {
  APPLIED = 'applied',
  FAILED = 'failed'
}

export interface IAirGapTransaction {
  from: string[]
  to: string[]
  isInbound: boolean
  amount: string
  fee: string
  timestamp?: number

  protocolIdentifier: ProtocolSymbols

  network: ProtocolNetwork

  hash?: string
  blockHeight?: string
  data?: string

  extra?: any
  status?: AirGapTransactionStatus

  transactionDetails?: any
}

export type IProtocolTransactionCursor =
  | EthereumTransactionCursor
  | RskTransactionCursor
  | BitcoinTransactionCursor
  | TezosTransactionCursor
  | AeternityTransactionCursor
  | SubstrateTransactionCursor
  | CosmosTransactionCursor
  | BitcoinBlockbookTransactionCursor

export interface IAirGapTransactionResult {
  transactions: IAirGapTransaction[]
  cursor: IProtocolTransactionCursor
}
