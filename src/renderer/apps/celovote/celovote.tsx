import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { ContractKit } from '@celo/contractkit'

import * as React from 'react'
import Box from '@material-ui/core/Box'

import AppHeader from '../../components/app-header'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { Celovote } from './def'
import useOnChainState from '../../state/onchain-state'
import { Typography } from '@material-ui/core'
import { CFG, mainnetNetworkId } from '../../../lib/cfg'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'

let _client: AxiosInstance
const gql = () => {
	if (!_client) {
		_client = axios.create({baseURL: "https://gql.celovote.com"})
	}
	return _client
}

async function promiseGQL<T extends {errors?: {message: string}[]}>(p: Promise<AxiosResponse<T>>) {
	try {
		const resp = await p
		console.info(`response`, resp.data)
		if (resp.data.errors && resp.data.errors.length > 0) {
			throw new Error(resp.data.errors[0].message)
		}
		return resp
	} catch (e) {
		if (e?.response) {
			throw new Error(`${e.message}: ${JSON.stringify((e as AxiosError).response)}`)
		}
		throw e
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CelovoteApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const account = props.selectedAccount
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		if (CFG().networkId !== mainnetNetworkId) {
			throw new Error(`Celovote APP only works with Mainnet.`)
		}
		const respP = gql().post<{
			errors?: {message: string}[],
			data: {
				addresses: {
					authorized: boolean,
				}[],
			}
		}>(
			'/',
			{query: `{ addresses(addresses:["${account.address}"]) { authorized } }`}
		)
		const resp = await promiseGQL(respP)
		return {
			isAuthorized: resp.data.data.addresses[0].authorized,
		}
	}, [account], props.onError)

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, () => { refetch() })
	}
	const handleAuthorize = () => {
		runTXs(async (kit: ContractKit) => {
			const resp = await promiseGQL(gql().post<{
				errors?: {message: string}[],
				data: {
					signer: string,
					signature: {v: number, r: string, s: string},
				},
			}>(
				'/',
				{query: `mutation {
					signPOP(address:"${account.address}") {
						signer
						signature { v r s }
					}
				}`}
			))
			const accountsC = await kit.contracts.getAccounts()
			const tx = await accountsC.authorizeVoteSigner(resp.data.data.signer, resp.data.data.signature)
			return [{tx: tx}]
		})
	}

	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={Celovote.title} url={Celovote.url} isFetching={isFetching} refetch={refetch} />
			{fetched && (
			fetched.isAuthorized ? <>
			<Box marginTop={2}>
				<Paper>
					<Box p={2}>
						<Typography>Authorized</Typography>
					</Box>
				</Paper>
			</Box>
			</> : <>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Button
							color="primary"
							variant="outlined"
							onClick={handleAuthorize}
							>Authorize</Button>
					</Box>
				</Paper>
			</Box>
			</>
			)}
		</Box>
	)
}
export default CelovoteApp