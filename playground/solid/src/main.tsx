/* @refresh reload */
import { render } from 'solid-js/web';
import { App } from './App.tsrx';

const target = document.getElementById('root');
if (!target) throw new Error('#root not found');

render(() => <App />, target);
