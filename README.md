# GoogleMapsOverlay lifecycle reproduction

The real, unpatched `@deck.gl/google-maps` 9.4.1 adapter can recreate Google overlays after `finalize()` when an initialization callback runs late. This repository isolates that sequence without a Google API key, browser, framework or GPU.

Requires Node.js 22+ and npm:

```sh
npm ci --ignore-scripts
npm start
```

`npm start` intentionally exits **1** with:

```text
TypeError: Cannot read properties of null (reading 'addListener')
    at createDeckInstance (.../@deck.gl/google-maps/dist/index.cjs:75:37)
    at GoogleMapsOverlay._onAddVectorOverlay (.../@deck.gl/google-maps/dist/index.cjs:396:20)
```

`npm run control` delivers the same initialization callbacks while the adapter stays attached; it exits **0** and creates one Deck. `npm test` checks both results and exits **0** only when the expected failure and successful control reproduce.

The sequence in [repro.cjs](repro.cjs) is:

1. Attach the adapter to a map reporting `UNINITIALIZED`.
2. Capture the registered `renderingtype_changed` callback.
3. Call `finalize()`.
4. Report `VECTOR`, run the captured callback, then deliver the pending overlay `onAdd` callbacks.

Expected: no overlay or Deck is created after finalization. Actual: the callback creates Google overlays, and their `onAdd` passes a null map to `createDeckInstance`, which attempts `map.addListener`.

The npm adapter and its helper functions are real. Only Deck's GPU-owning constructor is replaced; other core exports stay real. Google callbacks and the minimal DOM operations are controlled. The test deliberately invokes a captured callback after finalization, regardless of listener removal. It does **not** establish that the real Google SDK queues removed listeners this way, or how often that ordering occurs.

Related: [#10901](https://github.com/visgl/deck.gl/pull/10901) removes the rendering-type listener when detaching. A callback already captured before that cleanup still needs to reject an old map. In its `_onRenderingTypeChanged(map)` path, that check must precede removal of current overlays and destruction of Deck. This small repository tests the published 9.4.1 adapter; it does not build that unreleased PR or compare patches.
