import { Moola } from "./def";

import * as React from "react";
import { Box, Tab, Typography, Button, Tooltip } from "@material-ui/core";
import HelpOutline from "@material-ui/icons/HelpOutline";

import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";

import Deposit from './deposit';
import Withdraw from './withdraw';
import Borrow from './borrow';
import Repay from './repay';

import useLocalStorageState from '../../state/localstorage-state'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

const MoolaApp = (): JSX.Element => {
	const [tab, setTab] = useLocalStorageState("terminal/moola/tab", "deposit")

	return (
		<AppContainer>
			<AppHeader app={Moola} />
			<AppSection>
				<Box
					display="flex"
					flexDirection="row"
					alignItems="flex-end"
					justifyContent="space-between"
					marginTop={1}
				>
					<Box display="flex" flexDirection="column" alignItems="flex-end">
						<Box display="flex" flexDirection="column">
							<Typography variant="caption">
								Max slippage
								<Tooltip title="Your transaction will revert if the price changes unfavourably by more than this percentage.">
									<HelpOutline style={{ fontSize: 12 }} />
								</Tooltip>
							</Typography>
							<Box display="flex" flexDirection="row">
								<Button>test button 0</Button>
							</Box>
						</Box>
					</Box>
					<Box display="flex" flexDirection="column" width={200}>
						<Button color="primary" variant="outlined">
							Test button
						</Button>
					</Box>
				</Box>
			</AppSection>
			<TabContext value={tab}>
			<AppSection>
				<TabList onChange={(_, v) => { setTab(v) }}>
						<Tab value={"deposit"} label="Deposit" />
						<Tab value={"withdraw"} label="Withdraw" />
						<Tab
							value={"borrow"}
							label="Borrow"
						/>
						<Tab
							value={"repay"}
							label="Repay"
						/>
					</TabList>
					<TabPanel value="deposit">
						<Deposit />
					</TabPanel>
					<TabPanel value="withdraw">
						<Withdraw />
					</TabPanel>
					<TabPanel value="borrow">
						<Borrow />
					</TabPanel>
					<TabPanel value="repay">
						<Repay />
				</TabPanel>
				</AppSection>
				</TabContext>
		</AppContainer>
	);
};
export default MoolaApp;
