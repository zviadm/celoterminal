import { ParsedSignatureRequest } from './transaction-parser'
import { explorerRootURL } from '../../../lib/cfg'

import * as React from 'react'
import Link from '../../components/link'

const SignatureRequestTitle = (props: {
	req: ParsedSignatureRequest
}): JSX.Element => {
	return props.req.type === "transaction" ?
		<>
			Contract: {
				props.req.contractAddress ?
					<Link href={`${explorerRootURL()}/address/${props.req.contractAddress}`}>
						{props.req.contractName}
					</Link> :
					props.req.contractName
			}
		</> :
		props.req.type === "signPersonal" ?
		<>
			SignPersonal: {(props.req.dataAsText || props.req.data).substring(0, 20)}...
		</> :
		<></>
}

export default SignatureRequestTitle
