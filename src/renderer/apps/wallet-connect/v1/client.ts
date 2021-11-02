import log from 'electron-log'
import { CeloTx } from '@celo/connect'
import WalletConnect from 'wcv1/client'
import SessionStorage from "@walletconnect/core/dist/esm/storage"

import { CFG } from '../../../../lib/cfg'
import { IJsonRpcErrorMessage, RequestPayload, requestQueueGlobal, WCRequest } from '../request-queue'
import { removeSessionId, storedSessionIds } from './storage'

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

export const setupWCHandlers = (wc: WalletConnect): void => {
	wc.on("disconnect", (error) => {
		log.info(`wallet-connect: disconnected ${wc.session.peerMeta?.name}`, error)
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

export const initializeStoredSessions = (): {wc: WalletConnect}[] => {
	const sessionIds = storedSessionIds()
	log.info(`wallet-connect: loading stored sessions`, sessionIds)
	const wcs: {wc: WalletConnect}[] = []
	sessionIds.forEach((sessionId) => {
		try {
			const storage = new SessionStorage(sessionId)
			const session = storage.getSession()
			if (!session) {
				removeSessionId(sessionId)
				return
			}
			const wc = new WalletConnect({ session, storageId: sessionId })
			setupWCHandlers(wc)
			wcs.push({ wc })
		} catch (e) {
			removeSessionId(sessionId)
			log.error(`wallet-connect: removing uninitialized session`, sessionId, e)
		}
	})
	return wcs
}