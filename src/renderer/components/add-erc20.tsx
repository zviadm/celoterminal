import * as React from "react"
import { isValidAddress } from 'ethereumjs-util'
import { ensureLeading0x, toChecksumAddress } from '@celo/utils/lib/address'
import {
	Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Tab,
	Table, TableBody, TextField, TableRow, TableCell, Paper, TableContainer, Box
} from "@material-ui/core"
import { RegisteredErc20 } from "../../lib/erc20/core"
import { Autocomplete, TabContext, TabList, TabPanel } from "@material-ui/lab"
import { registeredErc20s } from "../../lib/cfg"
import { addCustomErc20, addRegisteredErc20 } from "../state/erc20list-state"
import kitInstance from "../state/kit"
import Erc20Contract from "../../lib/erc20/erc20-contract"


// AddErc20 component can be used to let the user select a new token to add
// in list of watched erc20s. AddErc20 token manages interaction with the
// local strage state for adding the token.
const AddErc20 = (props: {
	onCancel: () => void,
	onAdd: (erc20: RegisteredErc20) => void,
}): JSX.Element => {
	const [tabIdx, setTabIdx] = React.useState("search")
	const [erc20FullName, setErc20FullName] = React.useState("")
	const [customAddress, setCustomAddress] = React.useState("")
	const [fetchingCustom, setFetchingCustom] = React.useState(false)
	const [customErc20, setCustomErc20] = React.useState<undefined | {
		name: string,
		symbol: string,
		address: string,
		decimals: number,
	}>()
	React.useEffect(() => {
		setCustomErc20(undefined)
		if (!isValidAddress(customAddress)) {
			return
		}
		setFetchingCustom(true)
		let cancelled = false
		;(async () => {
			const kit = kitInstance()
			const contract = new Erc20Contract(kit, customAddress)
			const decimals = contract.decimals()
			const name = contract.name()
			const symbol = contract.symbol()
			const erc20 = {
				address: toChecksumAddress(ensureLeading0x(customAddress)),
				name: await name,
				symbol: await symbol,
				decimals: await decimals,
			}
			if (!cancelled) {
				setCustomErc20(erc20)
			}
		})()
		.finally(() => { setFetchingCustom(false) })
		return () => { cancelled = true }
	}, [customAddress])

	const fullList = registeredErc20s()
	const matchingErc20 = fullList.find((f) => f.fullName === erc20FullName)
	const canAdd =
		((tabIdx === "search") && matchingErc20) ||
		((tabIdx === "custom") && customErc20)
	const handleAdd = () => {
		let added
		if (tabIdx === "search") {
			if (!matchingErc20) {
				return
			}
			added = addRegisteredErc20(matchingErc20.fullName)
		} else {
			if (!customErc20) {
				return
			}
			added = addCustomErc20(customErc20)
		}
		return props.onAdd(added)
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add ERC20 Token</DialogTitle>
			<DialogContent>
				<Box minWidth={500}>
				<TabContext value={tabIdx}>
					<TabList
						onChange={(event, value) => { setTabIdx(value) }}
					>
						<Tab label="Search" value="search" />
						<Tab label="Custom Token" value="custom" />
					</TabList>
					<TabPanel value="search">
						<Autocomplete
							id="registered-erc20"
							options={fullList}
							getOptionLabel={(option) => option.fullName}
							renderInput={(params) =>
								<TextField
									{...params}
									label="ERC20"
									fullWidth={true}
									InputLabelProps={{shrink: true}}
								/>
							}
							inputValue={erc20FullName}
							onInputChange={(e, value) => { setErc20FullName(value) }}
						/>
					</TabPanel>
					<TabPanel value="custom">
						<TextField
							label="Token address"
							InputLabelProps={{shrink: true}}
							placeholder="0x..."
							size="medium"
							fullWidth={true}
							spellCheck={false}
							inputProps={{
								style: {fontFamily: "monospace"}
							}}
							value={customAddress}
							onChange={(event) => { setCustomAddress(event.target.value) }}
						/>
						{fetchingCustom && <LinearProgress />}
						{customErc20 &&
						<Box marginTop={2}>
						<TableContainer component={Paper}>
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell>Name</TableCell>
										<TableCell width="100%">{customErc20.name}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Symbol</TableCell>
										<TableCell>{customErc20.symbol}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Decimals</TableCell>
										<TableCell>{customErc20.decimals}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
						</Box>}
					</TabPanel>
				</TabContext>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button disabled={!canAdd} onClick={handleAdd}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddErc20