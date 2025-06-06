import { get } from "svelte/store";
import type { Claim, FiatProvider, Offer, Receipt } from "@openPleb/common/db/schema";
import { env } from "$env/dynamic/public";
import { userLoggedIn } from "./user";
import type { Environment, UserInfo } from "@openPleb/common/types";

const { PUBLIC_API_VERSION, PUBLIC_BACKEND_URL } = env;



export interface Data {
	offers: Offer[];
	claims: Claim[];
	receipts: Receipt[];
	unserInfos: UserInfo[];
	env: Environment,
	takers: number,
	makers: number
	fiatProviders: FiatProvider[]
}

export const createDataStore = () => {
	let offers: Offer[] = $state([])
	let claims: Claim[]  = $state([])
	let receipts: Receipt[]  = $state([])
	let takers: number  = $state(0)
	let makers: number  = $state(0)
	let userInfos: UserInfo[]  = $state([])
	let env: Environment | undefined = $state()
	let fiatProviders: FiatProvider[] = $state([])

	const init = async () => {
		const response = await fetch(
			`${PUBLIC_BACKEND_URL}/admin/data`,
			{
				headers: {
					Authorization: `Bearer ${get(userLoggedIn)?.access_token}`
				}
			});
		if (!response.ok) {
			userLoggedIn.logout()
			throw new Error("Failed to fetch data");
		}
		const data: Data = await response.json();

		env = data.env

		if (data.offers) {	
			offers.push(...data.offers);
		}
		if (data.claims) {	
		claims.push(...data.claims);
		}
		if (data.receipts) {	
		receipts.push(...data.receipts);
		}
		if (data.unserInfos) {
			userInfos.push(...data.unserInfos)
		}
		if (data.fiatProviders) {	
			fiatProviders.push(...data.fiatProviders);	
		}
		
	};

	const fetchForId = async (id: string) => {
		const response = await fetch(
			`${PUBLIC_BACKEND_URL}/api/${PUBLIC_API_VERSION}/data/for/${id}`,
		);
		const data: { claim: Claim; offer: Offer; receipt: Receipt, userInfos: UserInfo[]  } =
			await response.json();
		if (data.offer) {
			updateOffer(data.offer);
		}
		if (data.claim) {
			updateClaim(data.claim);
		}
		if (data.receipt) {
			updateReceipt(data.receipt);
		}
		if (data.userInfos) {
			for (const unserInfo of data.userInfos) {
				updateUserInfo(unserInfo)
			}
		}
	};

	const fetchForPubkey = async (pubkey: string) => {
		const response = await fetch(
			`${PUBLIC_BACKEND_URL}/api/${PUBLIC_API_VERSION}/data/${
				pubkey
			}`
		);
		const data: Data = await response.json();
		env = data.env
		for (const offer of offers) {
			updateOffer(offer);
		}
		for (const claim of claims) {
			updateClaim(claim);
		}
		for (const receipt of receipts) {
			updateReceipt(receipt);
		}
	}
		

	const newOffer = (offer: Offer) => {
		offers.unshift(offer);
	};
	const newReceipt = (receipt: Receipt) => {
		receipts.unshift(receipt);
	};

	const newClaim = (claim: Claim) => {
		claims.unshift(claim);
	};

	const updateOffer = (offer: Offer) => {
		const index = offers.findIndex((o) => o.id === offer.id);
		if (index !== -1) {
			offers[index] = offer;
		} else {
			offers.unshift(offer);
		}
	};

	const updateReceipt = (receipt: Receipt) => {
		const index = receipts.findIndex((r) => r.id === receipt.id);
		if (index !== -1) {
			receipts[index] = receipt;

		} else {
			receipts.unshift(receipt);
		}
	};

	const updateClaim = (claim: Claim) => {
		const index = claims.findIndex((c) => c.id === claim.id);
		if (index !== -1) {
			claims[index] = claim;
		} else {
			claims.unshift(claim);
		}
	};

	const updateUserInfo = (userInfo: UserInfo) => {
		const index = userInfos.findIndex((u) => u.pubkey === userInfo.pubkey);
		if (index !== -1) {
			userInfos[index] = userInfo;
		} else {
			userInfos.unshift(userInfo);
		}
	};

	const updateConnections = (data: {takers: number, makers:number}) => {
		makers = data.makers;
		takers = data.takers;
	}	

	

	return {
		get offers() {return offers},
		get receipts() {return receipts},
		get claims() {return claims},
		get takers() {return takers},
		get makers() {return makers},
		get env() {return env},
		get fiatProviders() {return fiatProviders},
		fetchForPubkey,
		init,
		updateOffer,
		fetchForId,
		updateReceipt,
		updateClaim,
		updateConnections,
		newOffer,
		newReceipt,
		newClaim,
	};
};

export const dataStore = createDataStore();
