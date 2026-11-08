# Add a Customizable, Interactive Map to a Web Page

This guide covers how to initialize, render, and customize an interactive Google
Map on a web page using the Maps JavaScript API.

--------------------------------------------------------------------------------

## Overview

To load a Google Map on a web page, you must:

1.  **Load the Maps JavaScript API** using the dynamic library import bootstrap
    loader with your API key.
2.  **Add a map container** to the HTML page (`<gmp-map>` web component or a
    `<div>` element) with appropriate CSS styles.
3.  **Load the `maps` library** via `google.maps.importLibrary('maps')` and
    initialize or interact with the map instance.

--------------------------------------------------------------------------------

## 1. Load the Maps JavaScript API Bootstrap

Add the dynamic library import bootstrap script to your HTML `<head>` (or
execute it in your JavaScript/TypeScript entry file). Replace `YOUR_API_KEY`
with your Google Maps Platform API key.

```html
<script>
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "YOUR_API_KEY",
    v: "weekly",
  });
</script>
```

--------------------------------------------------------------------------------

## 2. Add a Map to the Page

You can add a map using either the declarative `<gmp-map>` custom HTML web
component (preferred for modern integrations) or a standard `<div>` container
with JavaScript initialization.

### Option A: Using the `<gmp-map>` Web Component (Preferred)

The `<gmp-map>` element is a custom web component. Specify `center` (latitude,
longitude), `zoom`, and optionally `map-id` (required for features like Advanced
Markers).

#### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Simple Map (Web Component)</title>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
    <script type="module" src="./index.js"></script>
    <script>
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: "YOUR_API_KEY",
        v: "weekly"
      });
    </script>
  </head>
  <body>
    <gmp-map
      center="-34.397,150.644"
      zoom="8"
      map-id="DEMO_MAP_ID"
      internal-usage-attribution-ids="gmp_git_agentskills_v1">
    </gmp-map>
  </body>
</html>
```

#### TypeScript / JavaScript

```typescript
async function init(): Promise<void> {
  // Import the needed libraries.
  await google.maps.importLibrary('maps');

  // Access the map web component.
  const mapElement = document.querySelector('gmp-map') as google.maps.MapElement;

  // Access the underlying google.maps.Map object.
  const innerMap = mapElement.innerMap;

  // Set additional options on the underlying Map instance if needed.
  innerMap.setOptions({
    mapTypeControl: false,
  });
}

void init();
```

--------------------------------------------------------------------------------

### Option B: Using a `<div>` Element and JavaScript

When using a `<div>` container, you must explicitly define its CSS `height`
because empty `<div>` elements default to `0` height.

#### HTML & CSS

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Simple Map (div)</title>
    <style>
      /* Always set the map height explicitly to define the size of the div */
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
    <script type="module" src="./index.js"></script>
    <script>
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: "YOUR_API_KEY",
        v: "weekly"
      });
    </script>
  </head>
  <body>
    <div id="map"></div>
  </body>
</html>
```

#### TypeScript / JavaScript

Request the `VECTOR` rendering type for the best visual fidelity and support for
tilt and heading controls.

```typescript
let map: google.maps.Map;

async function init(): Promise<void> {
  // Import the needed libraries
  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

  // Create a new map attached to the #map div
  map = new Map(document.getElementById('map') as HTMLElement, {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
    renderingType: 'VECTOR',
    mapId: 'DEMO_MAP_ID',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });
}

void init();
```

--------------------------------------------------------------------------------

### Option C: Using React (`@vis.gl/react-google-maps`)

For React applications, use the official `@vis.gl/react-google-maps` library.
Wrap your map inside `<APIProvider>` and render the `<Map>` component.

Source:
[examples/basic-map/src/app.tsx](https://github.com/visgl/react-google-maps/blob/HEAD/examples/basic-map/src/app.tsx?utm_campaign=gmp_git_agentskills_v1)

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY as string;

const App = () => (
  <APIProvider apiKey={API_KEY}>
    <div style={{ height: '100vh', width: '100%' }}>
      <Map
        defaultZoom={8}
        defaultCenter={{ lat: -34.397, lng: 150.644 }}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={false}
        internalUsageAttributionIds={['gmp_git_agentskills_v1']}
      />
    </div>
  </APIProvider>
);

export default App;
```

--------------------------------------------------------------------------------

## 3. Set and Get Properties on the Map Instance

### Interacting with `<gmp-map>`

```typescript
const mapElement = document.querySelector('gmp-map') as google.maps.MapElement;

// Set top-level properties directly on the MapElement
mapElement.zoom = 10;

// Set MapOptions on the underlying google.maps.Map instance
mapElement.innerMap.setOptions({
  mapTypeControl: false,
  gestureHandling: 'cooperative',
});
```

### Interacting with `google.maps.Map` (`<div>`)

```typescript
// Update multiple options after initialization
map.setOptions({
  zoom: 10,
  mapTypeControl: false,
  gestureHandling: 'cooperative',
});

// Or use dedicated setter/getter methods
map.setCenter({ lat: 40.749933, lng: -73.98633 });
map.setZoom(13);
const currentZoom = map.getZoom();
```

--------------------------------------------------------------------------------

## 4. Common Customization Patterns

Based on official Google Maps Platform open-source samples, here are common
patterns for customizing map behavior, UI controls, events, and features.

### Adding an Advanced Marker to a Map

Source:
[samples/add-map/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/add-map/index.ts?utm_campaign=gmp_git_agentskills_v1)

```typescript
let map: google.maps.Map;

async function initMap(): Promise<void> {
  const position = { lat: -25.344, lng: 131.031 };

  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

  map = new Map(document.getElementById('map') as HTMLElement, {
    zoom: 4,
    center: position,
    mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });

  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: 'Uluru',
  });
}

void initMap();
```

### Controlling Scroll & Gesture Behavior (`gestureHandling`)

Source:
[samples/conserve-map-on-scroll/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/conserve-map-on-scroll/index.ts?utm_campaign=gmp_git_agentskills_v1)
&
[samples/controls-basic-map/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/controls-basic-map/index.ts?utm_campaign=gmp_git_agentskills_v1)

-   **`"cooperative"`**: Scroll events over the map scroll the page unless the
    user holds `Ctrl`/`Cmd` (or uses two fingers on touch screens). Ideal for
    maps embedded in scrollable articles.
-   **`"greedy"`**: All touch gestures and scroll events pan/zoom the map
    immediately. Ideal for full-screen map apps.
-   **`"none"`**: Disables panning and zooming via user gestures.

```typescript
map.setOptions({
  gestureHandling: "cooperative", // or "greedy", "none", "auto"
});
```

### Listening to Map Events

Source:
[samples/map-events/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/map-events/index.ts?utm_campaign=gmp_git_agentskills_v1)

Use `map.addListener(eventName, callback)` to react to user interactions and
viewport changes (e.g., `bounds_changed`, `center_changed`, `zoom_changed`,
`click`, `idle`).

```typescript
map.addListener("bounds_changed", () => {
  const center = map.getCenter();
  const zoom = map.getZoom();
  console.log("New center:", center?.toJSON(), "New zoom:", zoom);
});

map.addListener("click", (event: google.maps.MapMouseEvent) => {
  if (event.latLng) {
    console.log("Clicked coordinates:", event.latLng.toJSON());
  }
});
```

### Adding Custom UI Controls & HTML5 Geolocation

Source:
[samples/map-geolocation/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/map-geolocation/index.ts?utm_campaign=gmp_git_agentskills_v1)

You can push custom HTML elements into
`map.controls[google.maps.ControlPosition.*]`:

```typescript
async function addGeolocationControl(map: google.maps.Map): Promise<void> {
  const { InfoWindow } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
  const infoWindow = new InfoWindow();

  const locationButton = document.createElement("button");
  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");

  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          map.setCenter(pos);
        },
        () => {
          infoWindow.setPosition(map.getCenter()!);
          infoWindow.setContent("Error: The Geolocation service failed.");
          infoWindow.open(map);
        }
      );
    } else {
      infoWindow.setPosition(map.getCenter()!);
      infoWindow.setContent("Error: Your browser doesn't support geolocation.");
      infoWindow.open(map);
    }
  });
}
```

### Styling the Map (Cloud-Based Map ID vs. JSON Styles)

Source:
[samples/map-id-style/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/map-id-style/index.ts?utm_campaign=gmp_git_agentskills_v1)
&
[examples/change-map-styles/src/app.tsx](https://github.com/visgl/react-google-maps/blob/HEAD/examples/change-map-styles/src/app.tsx?utm_campaign=gmp_git_agentskills_v1)

-   **Cloud-based styling**: Pass a `mapId` configured in the Google Cloud
    Console:

    ```typescript
    const map = new Map(document.getElementById("map") as HTMLElement, {
      mapId: "8e0a97af9386fef",
      center: { lat: 48.85, lng: 2.35 },
      zoom: 12,
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });
    ```
-   **Client-side JSON styling** (for raster maps without a `mapId`): Pass a
    `google.maps.MapTypeStyle[]` array to the `styles` option. Note that
    changing `mapId` dynamically in frameworks like React creates a new
    `google.maps.Map` instance and incurs a new map load.

--------------------------------------------------------------------------------

## Important Notes on Performance & Billing

-   **Viewport Deferral**: To improve page load speeds, the Maps JavaScript API
    may internally defer loading interactive content until the map element or
    container approaches the viewport. Do not rely on this internal optimization
    to manage billing—to ensure billing is not incurred until a map is visible,
    explicitly defer its creation in your application code.
-   **Container Sizing**: Always ensure the parent containers (`html`, `body`,
    or wrapper elements) have an explicit height when using percentage heights
    (`height: 100%`) on `#map`, otherwise the map container will collapse to
    `0px` height and remain invisible.
