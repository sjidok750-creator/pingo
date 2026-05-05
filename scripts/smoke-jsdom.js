// Run the production web bundle in jsdom and capture runtime errors.
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../dist/_expo/static/js/web');
const main = fs.readdirSync(dir).filter((f) => f.endsWith('.js'))
  .sort((a, b) => fs.statSync(path.join(dir, b)).size - fs.statSync(path.join(dir, a)).size);
const bundlePath = path.join(dir, main[0]);
const bundle = fs.readFileSync(bundlePath, 'utf8');

const vconsole = new VirtualConsole();
const events = [];
['log', 'info', 'warn', 'error'].forEach((level) => {
  vconsole.on(level, (...args) => {
    events.push([`console.${level}`, args.map((a) => (a && a.stack) || String(a)).join(' ')]);
  });
});
vconsole.on('jsdomError', (err) => {
  events.push(['jsdomError', (err && err.stack) || String(err)]);
});

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'https://sjidok750-creator.github.io/pingo/',
  virtualConsole: vconsole,
});
const w = dom.window;

// Polyfills the bundle may rely on
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
// jsdom doesn't implement CSSOM font face / FontFace; stub them so expo-font doesn't throw
w.CSSFontFaceRule = function () {};
w.FontFace = function () { this.load = () => Promise.resolve(this); };
class FFS { add() {} delete() {} forEach() {} }
w.FontFaceSet = FFS;
Object.defineProperty(w.document, 'fonts', { value: new FFS() });
Object.defineProperty(w.document.head, 'appendChild', { value: function(){ return arguments[0]; }, configurable: true });
w.AudioContext = function () { return { createOscillator: () => ({ connect: () => ({ connect: () => {} }), start() {}, stop() {}, frequency: { value: 0 }, detune: { value: 0 } }), createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect: () => {} }) }), currentTime: 0, destination: {}, close: () => Promise.resolve() }; };
w.Notification = function () {}; w.Notification.permission = 'default'; w.Notification.requestPermission = () => Promise.resolve('default');

w.addEventListener('error', (e) => events.push(['window.error', `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`]));
w.addEventListener('unhandledrejection', (e) => events.push(['unhandledrejection', e.reason && (e.reason.stack || String(e.reason))]));

try {
  w.eval(bundle);
} catch (e) {
  events.push(['EVAL_THREW', (e && (e.stack || String(e)))]);
}

setTimeout(() => {
  console.log('--- root after eval ---');
  console.log(w.document.getElementById('root').outerHTML.slice(0, 1500));
  console.log('--- events:', events.length);
  for (const [k, v] of events) {
    if (typeof v === 'string' && v.length > 800) console.log(k, v.slice(0, 800));
    else console.log(k, v);
  }
  process.exit(0);
}, 2500);
