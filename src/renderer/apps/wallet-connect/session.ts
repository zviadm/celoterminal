
export interface SessionMetadata {
	description: string;
	url: string;
	icons: string[];
	name: string;
}

export interface ISession {
	isConnected: () => boolean
	disconnect: () => void
	metadata: () => SessionMetadata | null
}