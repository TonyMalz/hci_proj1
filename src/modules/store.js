import { writable } from 'svelte/store';
export const activeUITab = writable(0);
export const studyStore = writable([])
export const variableStore = writable([]);