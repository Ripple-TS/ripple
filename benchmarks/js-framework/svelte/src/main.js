import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
mount(App, { target });
