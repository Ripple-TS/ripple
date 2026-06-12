// Ambient declaration for `.tsrx` modules so TypeScript can resolve imports
// from test files and downstream apps without each file needing its own .d.ts.
// At RUNTIME these files are transformed by the ripple-new Vite plugin
// (compiler/vite.js) into ES modules that export component functions.
declare module '*.tsrx';
