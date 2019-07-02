import SensQVis from './SensQVis.svelte';
import "./modules/indexeddb.js"

const app = new SensQVis({
	target: document.body,
});

export default app;