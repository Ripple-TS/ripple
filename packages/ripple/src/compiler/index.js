// Public re-export of the Ripple compiler. The compiler itself lives in
// `@tsrx/ripple` since the Ripple/TSRX split; this module exists so
// downstream consumers (playgrounds, esm.sh users, older tooling) can keep
// importing `ripple/compiler` without knowing about the internal package.
export * from '@tsrx/ripple';
