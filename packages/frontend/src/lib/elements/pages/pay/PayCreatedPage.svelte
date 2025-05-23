<script lang="ts">
	import { env } from "$env/dynamic/public";
	import { Button } from "$lib/components/ui/button";
	import { ensureError } from "$lib/errors";
	import { formatCurrency } from "$lib/helper";
	import { proofsStore, sendEcash } from "@gandlaf21/cashu-wallet-engine";
	import type { Offer } from "@openPleb/common/db/schema";
	import { toast } from "svelte-sonner";
	import {	getEncodedToken  } from "@cashu/cashu-ts";

	const {PUBLIC_API_VERSION, PUBLIC_BACKEND_URL, PUBLIC_MINT_URL} = env;

    interface Props {offer: Offer; totalSats: number; bondTotalSats: number}
    
    let { offer, totalSats, bondTotalSats }: Props = $props();
    let isLoading = $state(false);
	const createInvoice = async () => {
        try {
            isLoading = true;
			const res = await fetch(
				`${PUBLIC_BACKEND_URL}/api/${PUBLIC_API_VERSION}/offers/${offer.id}/createinvoice`)
            if (!res.ok) {
                throw new Error(await res.text());
            }
            toast.success('Invoice created successfully');
        } catch (error) {
            const err = ensureError(error);
			console.error(err);
			toast.error(err.message);
        }
        finally {
            isLoading = false;
        }
    };
	const payWithTokens = async () => {
		try {
            isLoading = true;
			if (!totalSats || !bondTotalSats) {
				toast.warning("Could not pay with tokens, please try again later.");
				return;
			}
			const {send} = await sendEcash(PUBLIC_MINT_URL, totalSats+bondTotalSats)
			const res = await fetch(
				`${PUBLIC_BACKEND_URL}/api/${PUBLIC_API_VERSION}/offers/${offer.id}/paywithtoken`,
			{
				method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				body: JSON.stringify({
					token: getEncodedToken({mint: PUBLIC_MINT_URL, proofs: send}),
				}),
			})
            if (!res.ok) {
                throw new Error(await res.text());
            }
            toast.success('Paid!');
        } catch (error) {
            const err = ensureError(error);
			console.error(err);
			toast.error(err.message);
        }
        finally {
            isLoading = false;
        }
	};
</script>
<div class="flex flex-col gap-2 items-center w-full">
	<p class="text-lg font-bold">
		To list this offer, pay 
	</p>
	<p class="text-xl font-bold">{formatCurrency(totalSats, 'SAT')}</p>
	<p class="text-lg font-bold text-muted-foreground"> + {formatCurrency(bondTotalSats, 'SAT')} Bond</p>
	<Button class="w-full mt-5" onclick={payWithTokens} disabled={isLoading || (totalSats+bondTotalSats)>$proofsStore.reduce((acc, proof) => acc + proof.amount,0)}>
		Pay with tokens ({formatCurrency(totalSats + bondTotalSats, 'SAT')})</Button
	>
	<Button class="w-full mt-5"  onclick={createInvoice} disabled={isLoading} variant="outline"
		>Get Invoice ( {formatCurrency(totalSats + bondTotalSats, 'SAT')} )</Button
	>
</div>