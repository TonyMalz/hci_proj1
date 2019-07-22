import { writable } from 'svelte/store';
export const studyStore = writable([])
export const variableStore = writable([]);
export const tabStore = writable([{ title: "Home", type: "home", studyId: null }]);
export const msgStore = writable([]);
export const responseStore = writable([]);
export const userStore = writable([]);
export const activeTabIdx = writable(0);
export const activeStudyId = writable(null);
