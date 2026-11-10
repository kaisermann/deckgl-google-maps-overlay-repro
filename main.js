import {GoogleMapsOverlay} from '@deck.gl/google-maps';
import {ScatterplotLayer} from '@deck.gl/layers';

const form = document.querySelector('form');
const output = document.querySelector('#log');

function log(message) {
  output.textContent += String(message).replace(/([?&]key=)[^&\s)]+/g, '$1[redacted]') + '\n';
}

window.addEventListener('error', event => log(event.error?.stack ?? event.message));

form.addEventListener('submit', async event => {
  event.preventDefault();
  const key = document.querySelector('#key').value.trim();
  const finalizeImmediately = document.querySelector('#finalize').checked;
  if (!key) return;
  document.querySelector('#key').value = '';
  form.querySelector('button').disabled = true;
  output.textContent = '';

  try {
    await new Promise((resolve, reject) => {
      window.initMap = resolve;
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?' + new URLSearchParams({
        key, v: 'weekly', loading: 'async', libraries: 'maps', callback: 'initMap'
      });
      script.onerror = () => reject(new Error('Google Maps SDK could not load.'));
      document.head.append(script);
    });

    log(`Google Maps ${google.maps.version}; deck.gl 9.4.1`);
    const map = new google.maps.Map(document.querySelector('#map'), {
      center: {lat: 51.47, lng: 0.45}, zoom: 12,
      mapId: 'DEMO_MAP_ID', renderingType: google.maps.RenderingType.VECTOR
    });
    const initialType = map.getRenderingType();
    log(`Initial rendering type: ${initialType}`);
    map.addListener('renderingtype_changed', () => {
      log(`Google renderingtype_changed: ${map.getRenderingType()}`);
    });

    let finalized = false;
    const overlay = new GoogleMapsOverlay({
      interleaved: false,
      layers: [new ScatterplotLayer({
        id: 'dot', data: [[0.45, 51.47]], getPosition: position => position,
        getFillColor: [255, 0, 0, 180], getRadius: 500
      })],
      onLoad: () => log(`Deck loaded; finalized=${finalized}`)
    });

    overlay.setMap(map);
    log('overlay.setMap(map)');
    if (finalizeImmediately) {
      overlay.finalize();
      finalized = true;
      log('overlay.finalize()');
    } else {
      log('Control: the overlay stays attached. Expect a red dot.');
    }

    if (initialType !== google.maps.RenderingType.UNINITIALIZED) {
      log('Map was already initialized: this run does not exercise delayed initialization.');
    }
  } catch (error) {
    log(error.stack ?? error.message);
  }
});
