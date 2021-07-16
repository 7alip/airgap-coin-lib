import { SubProtocolSymbols } from '../../../utils/ProtocolSymbols'
import {
  RskProtocolNetwork,
  RskProtocolNetworkExtras,
  RskERC20ProtocolConfig,
  RskERC20ProtocolOptions,
} from '../RskProtocolOptions'

import { GenericRskERC20 } from './GenericRskERC20'

const RifToken = new GenericRskERC20(
  new RskERC20ProtocolOptions(
    new RskProtocolNetwork(undefined, undefined, undefined, undefined, new RskProtocolNetworkExtras(30)),
    new RskERC20ProtocolConfig(
      'RIF',
      'RSK Infrastructure Framework',
      'rif',
      SubProtocolSymbols.RBTC_ERC20,
      '0x2dd847af80418D280B7078888B6A6133083001C9',
      18
    )
  )
)

export { RifToken }
