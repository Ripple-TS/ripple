import { flushSync, mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('main') });
flushSync();
