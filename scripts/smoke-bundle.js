// Smoke-evaluate the production web bundle in jsdom to catch runtime errors.
const { JSDOM, ResourceLoader } = require('jsdom');
const fs = require('fs');
const path = require('path');

const bundlePath = fs.readdirSync(path.join(__dirname, '../dist/_expo/static/js/web'))
  .find((f) => f.endsWith('.js'));
const bundle = fs.readFileSync(path.join(__dirname, '../dist/_expo/static/js/web', bundlePath), 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'https://example.com/pingo/',
});
const window = dom.window;

// Capture errors
const errors = [];
window.addEventListener('error', (e) => {
  errors.push({ type: 'error', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
});
window.addEventListener('unhandledrejection', (e) => {
  errors.push({ type: 'unhandledrejection', reason: e.reason && (e.reason.stack || String(e.reason)) });
});

// Provide minimal extras
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
window.AudioContext = function () { return { createOscillator: () => ({ connect: () => ({ connect: () => {} }), start() {}, stop() {}, frequency: { value: 0 }, detune: { value: 0 } }), createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect: () => {} }) }), currentTime: 0, destination: {}, close: () => Promise.resolve() }; };

try {
  window.eval(bundle);
  console.log('BUNDLE_EVAL_OK');
} catch (e) {
  console.log('BUNDLE_EVAL_THREW');
  console.log(e && (e.stack || String(e)));
}

// Allow async microtasks
setTimeout(() => {
  console.log('--- root contents ---');
  console.log(window.document.getElementById('root').outerHTML);
  console.log('--- errors:', errors.length);
  for (const er of errors) console.log(JSON.stringify(er, null, 2));
  process.exit(0);
}, 1500);
