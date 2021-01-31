import { ContractKit, newKit } from '@celo/contractkit'
import { CFG } from '../../../common/cfg'

let _kit: ContractKit | undefined
let _kitURL: string
const kit = (): ContractKit => {
	const cfg = CFG()
	if (_kit && _kitURL !== cfg.defaultNetworkURL) {
		_kit.stop()
		_kit = undefined
	}
	if (!_kit) {
		_kit = newKit(cfg.defaultNetworkURL)
	}
	return _kit
}
export default kit
