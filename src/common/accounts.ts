export interface BaseAccount {
	name: string
	address: string
}

export interface AddressOnlyAccount extends BaseAccount {
	type: "address-only"
}

export interface LedgerAccount extends BaseAccount {
	type: "ledger"
	baseDerivationPath: string
	derivationPathIndex: number
}

export type Account = AddressOnlyAccount | LedgerAccount