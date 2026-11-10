# GoogleMapsOverlay: finalize during initialization

A small browser example using the real Google Maps SDK, `GoogleMapsOverlay` and `ScatterplotLayer`. The lifecycle is in [main.js](main.js): create a map, attach the overlay, then call `finalize()` immediately. There are no mocks, captured callbacks, forced events or adapter patches.

```sh
npm ci --ignore-scripts
npm start
```

Open [localhost:3000](http://localhost:3000). Requires Node.js 22.12+ and a Google Maps browser API key with Maps JavaScript API enabled and this referrer allowed. Enter the key in the page; the demo sends it to Google without saving it. No key belongs in this repository.

1. Leave **Finalize immediately** checked and click **Run**.
2. Read the initial rendering type and subsequent SDK events in the log; check the browser console for errors.
3. Reload, uncheck **Finalize immediately**, and run again. This control should show a red dot and log `Deck loaded; finalized=false`.

Expected: after finalization, a later rendering-type event must not create another Deck or register listeners on a null map.

On the affected path, a map starts as `UNINITIALIZED`, the overlay is finalized, then Google resolves the rendering type. The published 9.4.1 adapter still has an initialization listener, which can recreate its Google overlays and throw `Cannot read properties of null (reading 'addListener')` from `createDeckInstance`.

If the log says the map was already initialized, this load did **not** exercise that path. Try Chrome DevTools with **Disable cache** and network throttling before reloading. Throttling may expose the initialization window; it is not guaranteed to do so. The page does not manufacture that ordering.

Versions: Deck.gl 9.4.1, Google Maps weekly channel (the page logs the actual SDK version). [#10901](https://github.com/visgl/deck.gl/pull/10901) removes the initialization listener on detach; this example tests published 9.4.1, not that unreleased change. It does not demonstrate delivery of a callback after its listener is removed.

**Verification:** the build, local server, required-key validation and control checkbox were checked. A live run with an authorized Google Maps key has not been performed for this browser example. It is a reproduction attempt for the real timing window, not a claim that the error occurs on every load.
