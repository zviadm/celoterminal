import { ContractKit, newKit } from '@celo/contractkit'
import { CFG } from '../../common/cfg'

let _kit: ContractKit | undefined
const kit = (): ContractKit => {
	if (!_kit) {
		_kit = newKit(CFG.networkURL)
	}
	return _kit
}
export default kit
