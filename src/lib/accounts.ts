export interface BaseAccount {
	readonly name: string
	readonly address: string
}

export interface AddressOnlyAccount extends BaseAccount {
	readonly type: "address-only"
}

export interface LocalAccount extends BaseAccount {
	readonly type: "local"
	readonly encryptedData: string
}

export interface LedgerAccount extends BaseAccount {
	readonly type: "ledger"
	readonly baseDerivationPath: string
	readonly derivationPathIndex: number
}

export type Account =
	AddressOnlyAccount |
	LedgerAccount |
	LocalAccount