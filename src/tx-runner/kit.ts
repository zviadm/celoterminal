import { ContractKit, newKit } from '@celo/contractkit'

let _kit: ContractKit | undefined
const kit = (): ContractKit => {
	if (!_kit) {
		_kit = newKit(`https://forno.celo.org`)
	}
	return _kit
}
export default kit
