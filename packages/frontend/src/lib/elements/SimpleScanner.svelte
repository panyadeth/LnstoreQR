<script lang="ts">
	import { Scan, SwitchCamera } from 'lucide-svelte';
	import QrScanner from 'qr-scanner';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		isScanning: boolean;
		scannedResult?: string;
	}

	let { isScanning = $bindable(true), scannedResult = $bindable() }: Props = $props();

	let videoElem: HTMLVideoElement | undefined = $state();
	let qrScanner: QrScanner | undefined = $state();
	let cams: QrScanner.Camera[] | undefined = $state();
	let facingMode: QrScanner.FacingMode = 'environment';

	onMount(async () => {
		if (await QrScanner.hasCamera()) {
			if (!videoElem) {
				console.error('video element not present');
				return;
			}
			qrScanner = new QrScanner(
				videoElem,
				(result) => {
					onScanSuccess(result);
				},
				{
					/* your options or returnDetailedScanResult: true if you're not specifying any other options */
				}
			);
			qrScanner.start();
			cams = await QrScanner.listCameras(true);
			if (cams.length > 1) {
				qrScanner.setCamera(facingMode);
			}
		} else {
			cams = [];
		}
	});

	onDestroy(() => {
		if (qrScanner) {
			qrScanner.destroy();
		}
	});

	const onScanSuccess = (result: QrScanner.ScanResult) => {
		scannedResult = result.data;
		isScanning = false;
	};
</script>

<div class="flex min-h-96 w-full flex-col items-center justify-center">
	<div class="relative flex h-full w-80 items-center justify-center xl:w-[600px]">
		<div class="video-wrapper h-80 w-80 rounded-lg border bg-black p-2 xl:w-[600px]">
			{#if cams === undefined}
				loading camera...
			{:else if cams?.length === 0}
				camera not found
			{/if}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoElem} width="100%" height="auto" class="video-container"> </video>
		</div>

		<div class="absolute right-5 top-5 z-10 h-10 w-10">
			{#if (cams?.length ?? 0) > 1}
				<button
					class=""
					onclick={async () => {
						await qrScanner?.setCamera(facingMode);
						qrScanner?.stop();
						qrScanner?.start();
					}}
				>
					<SwitchCamera></SwitchCamera>
				</button>
			{/if}
		</div>
		<div class="absolute z-10 h-56 w-56 opacity-30">
			<Scan color="rgb(219 39 119)" size={220} strokeWidth={1}></Scan>
		</div>
	</div>
</div>

<style>
	.video-container {
		object-fit: cover;
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
	.video-wrapper {
		/* Telling our absolute positioned video to 
  be relative to this element */
		position: relative;

		/* Will not allow the video to overflow the 
  container */
		overflow: hidden;

		/* Centering the container's content vertically 
  and horizontally */
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
