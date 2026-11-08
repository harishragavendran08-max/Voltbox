# Add an Autocomplete Widget to a Web Page or App

## Overview

The **Place Autocomplete Widget (New)**
(`google.maps.places.PlaceAutocompleteElement` / `<gmp-place-autocomplete>`)
creates a self-contained text input field, supplies place predictions in a UI
pick list as the user types, and returns a `Place` object in response to user
selection via the `gmp-select` event listener.

Key features of the Place Autocomplete Widget (New):

-   Supports regional localization (including RTL languages) for placeholder
    text, prediction logos, and predictions.
-   Built-in accessibility support for screen readers and keyboard navigation.
-   Returns the modern `google.maps.places.Place` class for simplified field
    fetching.
-   Automatically manages session tokens for both Autocomplete predictions and
    the subsequent Place Details request.

### Prerequisites

-   You must enable **Places API (New)** on your Google Cloud project.
-   **European Economic Area (EEA) restriction:** If your billing address is in
    the European Economic Area (EEA), effective July 8, 2025, the Google Maps
    Platform EEA Terms of Service apply. Only developers with billing addresses
    outside the EEA may embed or combine the Autocomplete widget directly with a
    Google Map.

--------------------------------------------------------------------------------

## Implementation Workflows

### 1. Add an Autocomplete Widget to a Web Page

To embed a standalone Autocomplete widget on a web page:

1.  Load the `places` library via `google.maps.importLibrary('places')`.
2.  Instantiate `PlaceAutocompleteElement` (or declare
    `<gmp-place-autocomplete>` in HTML).
3.  Listen for the `gmp-select` event, convert `placePrediction` to a `Place`
    instance via `placePrediction.toPlace()`, and call `place.fetchFields()`
    with only the required data fields.

#### JavaScript / TypeScript

```typescript
async function init(): Promise<void> {
    // Request needed libraries.
    const { PlaceAutocompleteElement } =
        await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

    // Create the input HTML element, configure usage attribution, and append it.
    const placeAutocomplete = new PlaceAutocompleteElement();
    placeAutocomplete.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
    placeAutocomplete.placeholder = 'Search for a place...';
    document.body.appendChild(placeAutocomplete);

    // Inject HTML UI to display results.
    const selectedPlaceTitle = document.createElement('p');
    document.body.appendChild(selectedPlaceTitle);

    const selectedPlaceInfo = document.createElement('pre');
    document.body.appendChild(selectedPlaceInfo);

    // Add the gmp-select listener and display the results.
    placeAutocomplete.addEventListener(
        'gmp-select',
        async ({
            placePrediction,
        }: google.maps.places.PlacePredictionSelectEvent) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location'],
            });
            selectedPlaceTitle.textContent = 'Selected Place:';
            selectedPlaceInfo.textContent = JSON.stringify(
                place.toJSON(),
                /* replacer */ null,
                /* space */ 2
            );
        }
    );
}

void init();
```

--------------------------------------------------------------------------------

### 2. Add an Autocomplete Widget to a Google Map

If your billing address is outside the EEA, you can attach the Autocomplete
widget directly to a `<gmp-map>` using control slots (such as
`slot="control-inline-start-block-start"`).

#### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Place Autocomplete Map</title>
    <style>
      gmp-map {
        height: 100%;
      }
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      .place-autocomplete-card {
        background-color: #fff;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
        margin: 10px;
        padding: 5px;
        font-family: Roboto, sans-serif;
        font-size: small;
      }
      gmp-place-autocomplete {
        width: 300px;
      }
    </style>
  </head>
  <body>
    <gmp-map
      center="40.749933,-73.98633"
      zoom="13"
      map-id="DEMO_MAP_ID"
      internal-usage-attribution-ids="gmp_git_agentskills_v1">
      <div
        class="place-autocomplete-card"
        slot="control-inline-start-block-start">
        <gmp-place-autocomplete
          placeholder="Search for a place..."
          internal-usage-attribution-ids="gmp_git_agentskills_v1">
        </gmp-place-autocomplete>
      </div>
    </gmp-map>
    <script type="module" src="./index.js"></script>
  </body>
</html>
```

#### TypeScript / JavaScript (`index.ts`)

```typescript
const mapElement = document.querySelector('gmp-map') as google.maps.MapElement;
const placeAutocomplete = document.querySelector('gmp-place-autocomplete') as google.maps.places.PlaceAutocompleteElement;
let innerMap: google.maps.Map;
let marker: google.maps.marker.AdvancedMarkerElement;
let infoWindow: google.maps.InfoWindow;

async function init(): Promise<void> {
    // Request needed libraries.
    const [{ AdvancedMarkerElement }, { InfoWindow }] = await Promise.all([
        google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
        google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
    ]);

    // Get the inner map.
    innerMap = mapElement.innerMap;
    innerMap.setOptions({
        mapTypeControl: false,
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    // Use the bounds_changed event to restrict results to the current map bounds.
    innerMap.addListener('bounds_changed', () => {
        placeAutocomplete.locationRestriction = innerMap.getBounds()!;
    });

    // Create the marker and infoWindow.
    marker = new AdvancedMarkerElement({
        map: innerMap,
    });

    infoWindow = new InfoWindow();

    // Add the gmp-select listener, and display the results on the map.
    placeAutocomplete.addEventListener(
        'gmp-select',
        async ({ placePrediction }: google.maps.places.PlacePredictionSelectEvent) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({
                fields: [
                    'displayName',
                    'formattedAddress',
                    'location',
                    'viewport',
                ],
            });

            // If the place has a geometry, then present it on a map.
            if (place.viewport) {
                innerMap.fitBounds(place.viewport);
            } else if (place.location) {
                innerMap.setCenter(place.location);
                innerMap.setZoom(17);
            }

            const content = document.createElement('div');
            const nameText = document.createElement('span');
            nameText.textContent = place.displayName ?? 'No name';
            content.appendChild(nameText);
            content.appendChild(document.createElement('br'));
            const addressText = document.createElement('span');
            addressText.textContent = place.formattedAddress ?? 'No address';
            content.appendChild(addressText);

            updateInfoWindow(content, place.location);
            marker.position = place.location;
        }
    );
}

function updateInfoWindow(
    content: string | Element | Text | null | undefined,
    center: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
) {
    infoWindow.setContent(content);
    infoWindow.setPosition(center);
    infoWindow.open({
        map: innerMap,
        anchor: marker,
        shouldFocus: false,
    });
}

void init();
```

#### Programmatic Control Slot Insertion

If you prefer to create and attach the `PlaceAutocompleteElement` to `<gmp-map>`
purely in TypeScript/JavaScript:

```typescript
const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
const mapElement = document.querySelector('gmp-map') as google.maps.MapElement;

const placeAutocomplete = new PlaceAutocompleteElement({});
placeAutocomplete.setAttribute("internal-usage-attribution-ids", "gmp_git_agentskills_v1");

const card = document.createElement("div");
card.appendChild(placeAutocomplete);
card.setAttribute("slot", "control-inline-start-block-start");

if (mapElement) {
    mapElement.appendChild(card);
}
```

--------------------------------------------------------------------------------

## Constrain and Bias Autocomplete Predictions

By default, Place Autocomplete presents all place types and biases predictions
near the user's IP location. Set options on `PlaceAutocompleteElement` to
present more relevant predictions:

### 1. Restrict by Country (`includedRegionCodes`)

Specify an array of CLDR two-character region codes:

```typescript
placeAutocomplete.includedRegionCodes = ['us', 'au'];
```

### 2. Restrict to Map Bounds (`locationRestriction`)

Ignore any results outside the specified bounds. Set to `null` to remove the
restriction:

```typescript
google.maps.event.addListener(innerMap, 'bounds_changed', async () => {
    placeAutocomplete.locationRestriction = innerMap.getBounds();
});

// To clear restriction:
// placeAutocomplete.locationRestriction = null;
```

### 3. Bias to a Circular Area (`locationBias`)

Prefer results within a specified area while still allowing matches outside of
it. Set to `null` to remove the bias.

-   **Warning:** If `radius` is not provided, `location` is ignored. Do not set
    a viewport with zero radius, a radius less than 100 meters, or a viewport
    spanning the globe (5 km / 5000m is a sensible default when a specific
    radius is unknown).

```typescript
placeAutocomplete.locationBias = {
    radius: 5000,
    center: { lat: 40.749933, lng: -73.98633 },
};

// To clear bias:
// placeAutocomplete.locationBias = null;
```

### 4. Filter by Place Types (`includedPrimaryTypes`)

Restrict results to specific primary place types (from
[Place type tables A and B](https://developers.google.com/maps/documentation/places/web-service/place-types)):

```typescript
const autocomplete = new google.maps.places.PlaceAutocompleteElement({
    includedPrimaryTypes: ['establishment'],
});
autocomplete.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
```

--------------------------------------------------------------------------------

## Optimization Best Practices

### Cost Optimization

1.  **Always use Field Masks:** When calling `place.fetchFields({ fields: [...]
    })` inside the `gmp-select` listener, request only the specific fields your
    application needs (e.g., `['displayName', 'formattedAddress', 'location']`).
2.  **Built-in Session Management:** The `PlaceAutocompleteElement` widget
    automatically handles session tokens covering both the typing predictions
    and the `placePrediction.toPlace().fetchFields()` call.
3.  **When to use the Widget vs. Programmatic Autocomplete + Geocoding:**
    -   **Needs Place Details beyond address/lat-lng (e.g., `displayName`,
        `businessStatus`, `regularOpeningHours`) OR average user takes > 4
        requests before selecting:** Use `PlaceAutocompleteElement` (or
        programmatic session-based Autocomplete with
        `AutocompleteSessionToken`) + `place.fetchFields()`.
    -   **Needs ONLY address and `location` (lat/lng) AND users select a
        prediction in 4 or fewer requests on average:** Programmatic
        Autocomplete without session tokens paired with a Geocoding API call on
        the selected `placeId` can be more cost-effective.

### Performance & Fallback Handling

-   **Always provide sensible bounds or location bias:** Avoid relying solely on
    IP detection so users receive consistent, relevant predictions.
-   **Fallback when no prediction is selected:** If a user submits raw input
    without picking a suggestion (or enters subpremise addresses like apartment
    numbers or road-segment prefixes like `"23-30 29th St, Queens"`):
    -   Fall back to the **Geocoding API** if you expect address-only input.
    -   Fall back to **Place Details / Text Search** if you expect place names
        or mixed queries.

--------------------------------------------------------------------------------

## Supporting Code Samples

### Programmatic Autocomplete Data API with Session Tokens

If you need a completely custom UI instead of `PlaceAutocompleteElement`, use
`AutocompleteSuggestion.fetchAutocompleteSuggestions` with
`AutocompleteSessionToken`: Source:
https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-autocomplete-data-session/index.ts?utm_campaign=gmp_git_agentskills_v1

```typescript
let title: HTMLElement;
let results: HTMLElement;
let input: HTMLInputElement;
let token: google.maps.places.AutocompleteSessionToken;

let request: any = {
    input: "",
    locationRestriction: { west: -122.44, north: 37.8, east: -122.39, south: 37.78 },
    origin: { lat: 37.7893, lng: -122.4039 },
    includedPrimaryTypes: ["restaurant"],
    language: "en-US",
    region: "us",
    internalUsageAttributionIds: ["gmp_git_agentskills_v1"],
};

async function init() {
    await google.maps.importLibrary("places");
    token = new google.maps.places.AutocompleteSessionToken();

    title = document.getElementById('title') as HTMLElement;
    results = document.getElementById('results') as HTMLElement;
    input = document.querySelector("input") as HTMLInputElement;
    input.addEventListener("input", makeAcRequest);
    request = refreshToken(request);
}

async function makeAcRequest(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.value == '') {
        title.innerText = '';
        results.replaceChildren();
        return;
    }

    request.input = target.value;

    const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    title.innerText = 'Query predictions for "' + request.input + '"';
    results.replaceChildren();

    for (const suggestion of suggestions) {
        const placePrediction = suggestion.placePrediction;
        const a = document.createElement('a');
        a.addEventListener('click', () => {
            onPlaceSelected(placePrediction!.toPlace());
        });
        a.innerText = placePrediction!.text.toString();

        const li = document.createElement('li');
        li.appendChild(a);
        results.appendChild(li);
    }
}

async function onPlaceSelected(place: google.maps.places.Place) {
    await place.fetchFields({
        fields: ['displayName', 'formattedAddress'],
    });
    const placeText = document.createTextNode(place.displayName + ': ' + place.formattedAddress);
    results.replaceChildren(placeText);
    title.innerText = 'Selected Place:';
    input.value = '';
    refreshToken(request);
}

function refreshToken(req: any) {
    token = new google.maps.places.AutocompleteSessionToken();
    req.sessionToken = token;
    return req;
}
```
