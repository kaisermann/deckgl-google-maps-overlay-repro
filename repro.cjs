const assert = require('node:assert/strict');
const Module = require('node:module');

let deckCreations = 0;
class FakeDeck {
  userData = {};
  constructor(props) {
    this.props = props;
    deckCreations++;
  }
}

// Keep the adapter, helpers and other core exports real; avoid GPU initialization.
const originalLoad = Module._load;
let GoogleMapsOverlay;
try {
  Module._load = function (name, ...args) {
    const exports = originalLoad.call(this, name, ...args);
    return name === '@deck.gl/core' ? {...exports, Deck: FakeDeck} : exports;
  };
  ({GoogleMapsOverlay} = require('@deck.gl/google-maps'));
} finally {
  Module._load = originalLoad;
}

const pendingAdds = [];
const callbacks = new Set();
const pane = {appendChild() {}};
const container = {querySelector: () => null};
let renderingType = 'UNINITIALIZED';

class OverlayView {
  setMap(map) {
    this.map = map;
    if (map) pendingAdds.push(() => this.onAdd?.());
    else this.onRemove?.();
  }
  getMap() { return this.map; }
  getPanes() { return this.map ? {overlayLayer: pane} : null; }
}

global.document = {createElement: () => ({style: {}})};
global.google = {maps: {
  RenderingType: {UNINITIALIZED: 'UNINITIALIZED', VECTOR: 'VECTOR'},
  OverlayView,
  WebGLOverlayView: class extends OverlayView {}
}};

const map = {
  getRenderingType: () => renderingType,
  getDiv: () => container,
  addListener(event, callback) {
    if (event === 'renderingtype_changed') callbacks.add(callback);
    return {remove: () => callbacks.delete(callback)};
  }
};

const keepAttached = process.argv.includes('--keep-attached');
const overlay = new GoogleMapsOverlay({interleaved: false});
overlay.setMap(map);
const capturedCallbacks = [...callbacks];
assert.equal(capturedCallbacks.length, 1);

if (!keepAttached) overlay.finalize();

// Deliberately deliver callbacks captured before finalization, even if removed.
renderingType = 'VECTOR';
for (const callback of capturedCallbacks) callback();
for (const onAdd of pendingAdds) onAdd();

if (keepAttached) {
  assert.equal(deckCreations, 1);
  console.log('Control passed: the attached adapter creates one Deck.');
} else {
  throw new Error('Expected the unpatched adapter to throw null.addListener.');
}
