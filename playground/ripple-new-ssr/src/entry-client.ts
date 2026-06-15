import { hydrate } from 'ripple-new';
import { App } from './App.tsrx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Adopt the server-rendered DOM inside #app instead of building it from scratch:
// hydrate() reuses the existing elements/text, attaches event handlers, and
// seeds any serialized use(promise) values (the inline data <script>) so the
// async boundary resolves synchronously without a client re-fetch.
hydrate(App, container);
