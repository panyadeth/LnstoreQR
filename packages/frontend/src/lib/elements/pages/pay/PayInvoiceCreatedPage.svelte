<script lang="ts">
	import { env } from '$env/dynamic/public';
	import CopiableToken from '$lib/elements/CopiableToken.svelte';
	import { LoaderCircle } from 'lucide-svelte';
	import { decode } from 'light-bolt11-decoder';
	import { encodeQR } from 'qr';
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/helper';
	import type { Offer } from '@openPleb/common/db/schema';
	import Expiry from '$lib/elements/Expiry.svelte';

	const { PUBLIC_API_VERSION, PUBLIC_BACKEND_URL } = env;

    interface Props {offer: Offer}
    
    let {offer}: Props = $props();

	$inspect(offer);
	onMount(() => {
		const interval = setInterval(async () => {
			if (!offer) {
				return;
			}
			//TODO instead of polling, do this with websockets
			const res = await fetch(
				`${PUBLIC_BACKEND_URL}/api/${PUBLIC_API_VERSION}/offers/${offer.id}/checkpaidinvoice`
			);
			const data = await res.json();

			if (data.state === 'PAID' || data.state === 'ISSUED') {
				clearInterval(interval);
			}
		}, 5000);
		return () => clearInterval(interval);
	});
</script>

{#if offer?.invoice}
	<div class="flex w-full flex-col gap-2">
		<div class=" flex w-full flex-col items-center justify-center gap-2">
			<p class="text-xl font-bold">Step 3: Pay Invoice</p>
			<p>
				{formatCurrency(Math.ceil(decode(offer.invoice).sections[2].value / 1000), 'SAT')}
			</p>
		</div>
		<a href="lightning:{offer.invoice}">
			<div class="w-full rounded-md border p-2 bg-white">
				{@html encodeQR(offer?.invoice, 'svg')}
			</div>
		</a>
		<CopiableToken token={offer?.invoice}></CopiableToken>
		<div>
            <p class="font-semibold mb-1">Expiry</p>
            <Expiry offer={offer} />
        </div>
	</div>
{:else}
	<LoaderCircle class="animate-spin"></LoaderCircle>
{/if}
