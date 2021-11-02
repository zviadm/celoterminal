export interface SessionMetadata {
	name: string
	description: string
	url: string
	icon?: string
	accounts: string[]
}

export interface ISession {
	isConnected: () => boolean
	disconnect: () => void
	metadata: () => SessionMetadata | null
}