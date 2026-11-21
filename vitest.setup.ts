// vitest.setup.ts
//
// Global test setup for Holo Carousel. Tests run under jsdom (see
// vitest.config.ts), so window/document/HTMLElement/performance are already
// real DOM globals - nothing needs polyfilling here.
//
// (This used to import a './src/utils/crypto-polyfill' that doesn't exist
// in this project, plus mocks for process.hrtime/setImmediate/process.exit
// - Node-internal concerns from Cyre's own TimeKeeper test suite, not
// anything Holo Carousel's DOM-driven code needs. Left as an empty hook
// point for real shared setup later.)
export {}
