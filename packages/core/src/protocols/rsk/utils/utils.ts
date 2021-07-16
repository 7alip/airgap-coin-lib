import { BigNumber } from '../../../dependencies/src/bignumber.js-9.0.0/bignumber'
import { InvalidValueError } from '../../../errors'
import { Domain } from '../../../errors/coinlib-error'
// var _ = require('underscore')
// var BN = require('../../../dependencies/src/bn.js-4.11.8/bn')
// var numberToBN = require('number-to-bn')
const utf8 = require('../../../dependencies/src/utf8-3.0.0/utf8')
const createKeccakHash = require('../../../dependencies/src/keccak-1.0.2/js')

// TODO: Check utility functions if compatible with RSK
// this code was adapted from web3.js (https://github.com/ethereum/web3.js/blob/2.x/packages/web3-utils/src/Utils.js)
export class RskUtils {
  public static toHex(value: any): string {
    if (RskUtils.isAddress(value)) {
      return `0x${value.toLowerCase().replace(/^0x/i, '')}`
    }

    if (typeof value === 'boolean') {
      return value ? '0x01' : '0x00'
    }

    if (RskUtils.isObject(value) && !RskUtils.isBigNumber(value) /* && !EthereumUtils.isBN(value)*/) {
      return RskUtils.utf8ToHex(JSON.stringify(value))
    }

    // if its a negative number, pass it through numberToHex
    if (typeof value === 'string') {
      if (value.indexOf('-0x') === 0 || value.indexOf('-0X') === 0) {
        return RskUtils.numberToHex(value)
      } else if (value.indexOf('0x') === 0 || value.indexOf('0X') === 0) {
        return value
      } else if (!isFinite(Number(value))) {
        return RskUtils.utf8ToHex(value)
      }
    }

    return RskUtils.numberToHex(value)
  }

  public static sha3(value: any): string | null {
    let valueInBytes: string | number[] = value
    if (RskUtils.isHexStrict(value) && /^0x/i.test(value.toString())) {
      valueInBytes = RskUtils.hexToBytes(value)
    }

    const hash: string = createKeccakHash('keccak256').update(valueInBytes).digest('hex')
    const returnValue: string = `0x${hash}`
    
    return returnValue
  }

  private static numberToHex(value: string | number): string {
    if (value === null || value === undefined) {
      return value
    }

    if (!isFinite(Number(value)) && !RskUtils.isHexStrict(value)) {
      throw new InvalidValueError(Domain.UTILS, `Given input "${JSON.stringify(value)}" is not a number.`)
    }

    // var number = EthereumUtils.toBN(value)
    const myNumber: BigNumber = new BigNumber(value)
    const result: string = myNumber.toString(16)

    return myNumber.lt(new BigNumber(0)) ? `-0x${result.substr(1)}` : `0x${result}`
  }

  private static hexToBytes(value: string | number): number[] {
    let hex: string = typeof value === 'number' ? value.toString(16) : value

    if (!RskUtils.isHexStrict(hex)) {
      throw new InvalidValueError(Domain.UTILS, `Given value "${JSON.stringify(hex)}" is not a valid hex string.`)
    }

    hex = hex.replace(/^0x/i, '')

    const bytes: number[] = []
    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16))
    }

    return bytes
  }

  private static isHexStrict(hex: unknown): boolean {
    return (typeof hex === 'string' || typeof hex === 'number') && /^(-)?0x[0-9a-f]*$/i.test(hex.toString())
  }

  public static checkAddressChecksum(address: string, chainId: number = 30): boolean {
    return RskUtils.isAddress(address) && (RskUtils.toChecksumAddress(address, chainId) === address)
  }

  private static isAddress(value: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(value)
  }

  private static isBigNumber(value: unknown): boolean {
    if (!value) {
      return false
    } else {
      return BigNumber.isBigNumber(value)
    }
  }

  private static utf8ToHex(value: string): string {
    let str: string = utf8.encode(value)
    let hex: string = ''

    // remove \u0000 padding from either side
    str = str.replace(/^(?:\u0000)*/, '')
    str = str.split('').reverse().join('')
    str = str.replace(/^(?:\u0000)*/, '')
    str = str.split('').reverse().join('')

    for (let i = 0; i < str.length; i++) {
      const code: number = str.charCodeAt(i)
      const n: string = code.toString(16)
      hex += n.length < 2 ? `0${n}` : n
    }

    return `0x${hex}`
  }

  private static isObject(value: unknown): boolean {
    const type: string = typeof value

    return type === 'function' || (type === 'object' && !!value)
  }

  public static toChecksumAddress(address: string, chainId = 30) {
    if (typeof address !== 'string') {
      throw new Error("stripHexPrefix param must be type 'string', is currently type " + (typeof address) + ".");
    }
  
    const strip_address = RskUtils.stripHexPrefix(address).toLowerCase()
    const prefix = chainId != null ? (chainId.toString() + '0x') : ''
    const keccak_hash = RskUtils.keccak256(prefix + strip_address).toString('hex')
    let output = '0x'
  
    for (let i = 0; i < strip_address.length; i++)
      output += parseInt(keccak_hash[i], 16) >= 8 ?
        strip_address[i].toUpperCase() :
        strip_address[i]
  
    return output
  }

  public static stripHexPrefix(str: string): string {
    return str.slice(0, 2) === '0x' ? str.slice(2) : str
  }

  private static keccak256(a) {
    return createKeccakHash('keccak256').update(a).digest('hex')
  }
}
