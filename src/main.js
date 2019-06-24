import SenseQVis from './SenseQVis.svelte';
import "./indexeddb.js"

const app = new SenseQVis({
	target: document.body,
});

export default app;