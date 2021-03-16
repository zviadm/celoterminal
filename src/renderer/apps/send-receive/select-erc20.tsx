import { RegisteredErc20 } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	Select, MenuItem, Typography, Box, IconButton,
	ListItemText, ListItemSecondaryAction
} from '@material-ui/core'
import Close from '@material-ui/icons/Close'
import Search from '@material-ui/icons/Search'

const SelectErc20 = (props: {
	erc20s: RegisteredErc20[],
	selected: RegisteredErc20,
	onSelect: (erc20: RegisteredErc20) => void,
	onRemoveToken: (erc20: RegisteredErc20) => void,
	onAddToken: () => void,
}): JSX.Element => {
	return (
		<Select
			id="erc20-select"
			autoFocus
			label="Token"
			value={props.selected.symbol}
			onChange={(event) => {
				if (event.target.value === "add-token") {
					props.onAddToken()
				} else {
					const selected = props.erc20s.find((e) => e.symbol === event.target.value)
					if (selected) {
						props.onSelect(selected)
					}
				}
			}}>
			{
				props.erc20s.map((erc20) => {
					return (
						<MenuItem
							key={erc20.address || erc20.symbol}
							id={`erc20-${erc20.symbol}-item`}
							value={erc20.symbol}>
							<ListItemText
								primary={erc20.symbol}
								secondary={erc20.name}
							/>
							{erc20.address !== "" &&
							<ListItemSecondaryAction>
								<IconButton
									id={`remove-token-${erc20.symbol}`}
									size="small"
									onClick={(event) => {
										props.onRemoveToken(erc20)
										event.stopPropagation()
									}}>
									<Close />
								</IconButton>
							</ListItemSecondaryAction>}
						</MenuItem>
					)
				})
			}
			<MenuItem id="add-token" value="add-token">
				<Box display="flex" flexDirection="row" alignItems="center">
					<Typography
						style={{fontStyle: "italic"}}
						color="textSecondary">Search...</Typography>
					<Search style={{marginLeft: 5}} />
				</Box>
			</MenuItem>
		</Select>
	)
}
export default SelectErc20