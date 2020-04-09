import { AeternityProtocol } from '../protocols/aeternity/AeternityProtocol'
import { BitcoinProtocol } from '../protocols/bitcoin/BitcoinProtocol'
import { CosmosProtocol } from '../protocols/cosmos/CosmosProtocol'
import { EthereumProtocol } from '../protocols/ethereum/EthereumProtocol'
import { GroestlcoinProtocol } from '../protocols/groestlcoin/GroestlcoinProtocol'
import { ICoinProtocol } from '../protocols/ICoinProtocol'
import { TezosProtocol } from '../protocols/tezos/TezosProtocol'
import { SubstrateProtocol } from '../protocols/substrate/SubstrateProtocol'

const protocols: ICoinProtocol[] = []

const supportedProtocols: () => ICoinProtocol[] = (): ICoinProtocol[] => {
  if (protocols.length === 0) {
    // We cannot assign the protocols outside a function because the compiler complains
    // The reason is that we have a circular dependency in the EthereumProtocol.
    protocols.push(
      new AeternityProtocol(),
      new BitcoinProtocol(),
      new EthereumProtocol(),
      new GroestlcoinProtocol(),
      new TezosProtocol(),
      new CosmosProtocol(),
      new SubstrateProtocol()
    )
  }

  return protocols
}

const addSupportedProtocol: (newProtocol: ICoinProtocol) => void = (newProtocol: ICoinProtocol): void => {
  if (supportedProtocols().find((protocol: ICoinProtocol) => protocol.identifier === newProtocol.identifier)) {
    throw new Error(`protocol ${newProtocol.name} already exists`)
  }

  protocols.push(newProtocol)
}

export { addSupportedProtocol, supportedProtocols }
