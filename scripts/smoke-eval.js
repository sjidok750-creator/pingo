// Minimal sandbox eval to catch syntax/static-init errors in the bundle.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '../dist/_expo/static/js/web');
const main = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort((a, b) => fs.statSync(path.join(dir, b)).size - fs.statSync(path.join(dir, a)).size);
const bundlePath = path.join(dir, main[0]);
const bundle = fs.readFileSync(bundlePath, 'utf8');

// Minimal globals so the bundle can attach things without crashing
const fakeListener = () => {};
const fakeStorage = { getItem(){return null}, setItem(){}, removeItem(){}, clear(){}, length: 0, key(){return null} };
const fakeNotification = function() {}; fakeNotification.permission = 'default'; fakeNotification.requestPermission = () => Promise.resolve('default');
const document = {
  createElement: () => ({ style: {}, setAttribute(){}, appendChild(){}, addEventListener(){}, removeEventListener(){}, getContext(){return null} }),
  getElementById: () => ({ appendChild(){} }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(){}, removeEventListener(){},
  body: { appendChild(){}, addEventListener(){} },
  documentElement: { style: {} },
  head: { appendChild(){} },
  readyState: 'complete',
  cookie: '',
};
const window = {
  document,
  navigator: { userAgent: 'Mozilla/5.0 (jsdom)' , language: 'ko', languages: ['ko','en'], onLine: true, platform: 'Linux' },
  location: { href: 'https://example.com/pingo/', origin: 'https://example.com', protocol: 'https:', host: 'example.com', pathname: '/pingo/', search: '', hash: '' },
  localStorage: fakeStorage,
  sessionStorage: fakeStorage,
  Notification: fakeNotification,
  AudioContext: function(){ return { createOscillator:()=>({connect:()=>({connect:()=>{}}), start(){}, stop(){}, frequency:{value:0}, detune:{value:0}}), createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect:()=>({connect:()=>{}})}), currentTime:0, destination:{}, close:()=>Promise.resolve() }; },
  setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame: (cb) => setTimeout(cb, 16), cancelAnimationFrame: clearTimeout,
  matchMedia: () => ({ matches: false, addListener: fakeListener, removeListener: fakeListener, addEventListener: fakeListener, removeEventListener: fakeListener }),
  addEventListener: fakeListener, removeEventListener: fakeListener,
  performance: { now: () => Date.now() },
  console,
  fetch: () => Promise.reject(new Error('no fetch in sandbox')),
};
window.window = window;
window.self = window;
window.globalThis = window;

const errors = [];
process.on('uncaughtException', (e) => errors.push(['uncaught', e.stack || String(e)]));
process.on('unhandledRejection', (e) => errors.push(['unhandled', e && (e.stack || String(e))]));

const ctx = vm.createContext(window);
try {
  vm.runInContext(bundle, ctx, { filename: 'bundle.js', timeout: 8000 });
  console.log('EVAL_OK');
} catch (e) {
  console.log('EVAL_THREW');
  console.log(e && (e.stack || String(e)));
}

setTimeout(() => {
  console.log('--- captured errors:', errors.length);
  for (const er of errors) console.log(er[0], er[1]);
  process.exit(0);
}, 800);
