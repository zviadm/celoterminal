import log from 'electron-log'
import { CeloTx } from '@celo/connect'
import WalletConnect from 'wcv1/client'
import SessionStorage from "@walletconnect/core/dist/esm/storage"

import { CFG } from '../../../../lib/cfg'
import { IJsonRpcErrorMessage, RequestPayload, requestQueueGlobal, WCRequest } from '../request-queue'
import { removeSessionId, storedSessionIds } from './storage'
import { ISession, SessionMetadata } from '../session'

export const celoTerminalMetadata = {
	name: "Celo Terminal",
	description: "The one-stop shop for everything Celo",
	url: "https://celoterminal.com",
	icons: ["https://celoterminal.com/static/favicon.ico"],
}

class WCV1Request implements WCRequest {
	constructor(
		private wc: WalletConnect,
		public readonly request: RequestPayload) {
	}

	reject = (error?: IJsonRpcErrorMessage): void => {
		return this.wc.rejectRequest({
			id: this.request.id,
			error: error,
		})
	}

	approve = (result: unknown): void => {
		return this.wc.approveRequest({
			id: this.request.id,
			result: result,
		})
	}
}

export class WCV1 implements ISession {
	constructor (
		public readonly sessionId: string,
		public readonly wc: WalletConnect,
		) {
		wc.on("disconnect", (error) => {
			log.info(`wallet-connect: disconnected ${wc.session.peerMeta?.name}`, error)
			removeSessionId(this.sessionId)
		})
		wc.on("call_request", (error, payload: {id: number, method: string, params: unknown[]}) => {
			if (error) {
				log.error(`wallet-connect: call_request error`, error)
				return
			}
			log.info(`wallet-connect: call_request`, payload)
			switch (payload.method) {
			case "eth_sendTransaction":
			case "eth_signTransaction": {
				const params = payload.params[0] as CeloTx
				if (!params.chainId) {
					params.chainId = Number.parseInt(CFG().chainId)
				}
				requestQueueGlobal.pushRequest(
					new WCV1Request(wc, {
						id: payload.id,
						method: payload.method,
						params: params,
					})
				)
				break
			}
			default:
				wc.rejectRequest({
					id: payload.id,
					error: {message: `${payload.method} not supported!`},
				})
			}
		})
	}

	isConnected = (): boolean => {
		return this.wc.connected
	}

	disconnect = (): void => {
		this.wc.killSession()
		this.wc.off("disconnect")
		this.wc.off("call_request")
		removeSessionId(this.sessionId)
	}

	metadata = (): SessionMetadata | null => {
		const metadata = this.wc.session.peerMeta
		if (!metadata) {
			return null
		}
		return {
			name: metadata.name,
			description: metadata.description,
			url: metadata.url,
			icon: metadata.icons[0],
			accounts: this.wc.session.accounts,
		}
	}
}

export const initializeStoredSessions = (): WCV1[] => {
	const sessionIds = storedSessionIds()
	log.info(`wallet-connect: loading stored sessions`, sessionIds)
	const wcs: WCV1[] = []
	sessionIds.forEach((sessionId) => {
		try {
			const storage = new SessionStorage(sessionId)
			const session = storage.getSession()
			if (!session) {
				removeSessionId(sessionId)
				return
			}
			const wc = new WalletConnect({ session, storageId: sessionId })
			wcs.push(new WCV1(sessionId, wc))
		} catch (e) {
			removeSessionId(sessionId)
			log.error(`wallet-connect: removing uninitialized session`, sessionId, e)
		}
	})
	return wcs
}
