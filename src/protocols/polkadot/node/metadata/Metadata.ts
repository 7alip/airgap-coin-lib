import { MetadataModule } from './module/MetadataModule'
import { SCALEClass } from '../codec/type/SCALEClass'
import { SCALEInt } from '../codec/type/SCALEInt'
import { SCALEArray } from '../codec/type/SCALEArray'
import { SCALEDecoder } from '../codec/SCALEDecoder'

const MAGIC_NUMBER = '6174656d' // `meta` in hex
const EXPECTED_VERSION = 11

export class Metadata extends SCALEClass {

    public static decode(raw: string): Metadata {
        const decoder = new SCALEDecoder(raw)

        const magicNumber = decoder.decodeNextInt(32) // 32 bits
        this.assertMagicNumber(magicNumber.decoded.toNumber())

        const version = decoder.decodeNextInt(8) // 8 bits
        this.assertVersion(version.decoded.toNumber())

        const modules = decoder.decodeNextArray(MetadataModule.decode)

        return new Metadata(magicNumber.decoded, version.decoded, modules.decoded)
    }

    private static assertMagicNumber(magicNumber: number) {
        if (magicNumber !== parseInt(MAGIC_NUMBER, 16)) {
            throw new Error('Error while parsing metadata, invalid magic number')
        }
    }

    private static assertVersion(version: number) {
        if (version !== EXPECTED_VERSION) {
            throw new Error(`Error while parsing metadata, metadata version ${EXPECTED_VERSION} was expected, got ${version}`)
        }
    }

    protected scaleFields = [this.magicNumber, this.version, this.modules]

    private constructor(
        readonly magicNumber: SCALEInt,
        readonly version: SCALEInt,
        readonly modules: SCALEArray<MetadataModule>
    ) { super() }
}