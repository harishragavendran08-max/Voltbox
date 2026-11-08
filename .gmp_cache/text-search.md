# Return a list of places and place details based on a query string.

Text Search (New) takes a text query or phone number and returns a list of
matching places along with the requested place details.

## Prerequisites

To use Text Search (New) via `Place.searchByText()`, you must:

1.  Enable **Places API (New)** on your Google Cloud project. See
    [Get started](https://developers.google.com/maps/documentation/javascript/place-get-started)
    for details.
2.  Load the Maps JavaScript API using the dynamic library import bootstrap
    loader, and import the `places` library via
    `google.maps.importLibrary('places')`.

> **European Economic Area (EEA) developers:** If your billing address is in the
> European Economic Area, effective on 8 July 2025, the
> [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea)
> will apply to your use of the Services. Functionality varies by region.
> [Learn more](https://developers.google.com/maps/comms/eea/faq).

--------------------------------------------------------------------------------

## Workflow: Find Places by Text Query

### 1. Import the Places Library

Dynamically import the `places` library (along with `maps`, `marker`, and `core`
if displaying results on a map).

```javascript
const { Place } = await google.maps.importLibrary('places');
```

### 2. Construct the `SearchByTextRequest`

Create a request object specifying your query, the required data fields, and
optional filters or location constraints:

*   **`textQuery`** *(required)*: The text string or phone number to search for
    (e.g., `"pizza in New York"`, `"shoe stores near Ottawa"`,
    `"123 Main Street"`).
*   **`fields`** *(required)*: An array of one or more
    [Place data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields)
    in camelCase (e.g.,
    `['displayName', 'location', 'businessStatus', 'formattedAddress']`). Use
    `['*']` only during development; in production, request only the fields you
    use to control billing SKU costs.
*   **`locationBias` or `locationRestriction`** *(optional)*: Bias or strictly
    restrict results to a specific region (such as `map.getBounds()` or a
    `LatLngLiteral`). Do not specify both in the same request.
*   **`includedType`** *(optional)*: Restrict the query to a specific place type
    (e.g., `'restaurant'`). Leave blank or omit for any type.
*   **`useStrictTypeFiltering`** *(optional)*: Boolean indicating whether to
    strictly filter by `includedType`.
*   **`isOpenNow`** *(optional)*: Boolean to return only places currently open.
*   **`minRating`** *(optional)*: Minimum average user rating (`1.0` to `5.0`).
*   **`maxResultCount`** *(optional)*: Maximum number of results to return.
*   **`language` / `region`** *(optional)*: Language code (e.g., `'en-US'`) and
    region code (e.g., `'us'`).
    *   *Phone Number Searches:* If `textQuery` contains a phone number, you
        should explicitly set the `region` parameter (e.g., `'jp'` for Japan).
        If `region` is omitted, the API defaults to the United States (`'us'`).

### 3. Call `Place.searchByText()`

Pass the request object to `Place.searchByText(request)`. The method returns a
Promise resolving to an object containing a `places` array of
`google.maps.places.Place` instances with the requested `fields` already
populated.

```javascript
const request = {
    textQuery: 'Tacos in Mountain View',
    fields: ['displayName', 'location', 'businessStatus'],
    includedType: 'restaurant',
    locationBias: { lat: 37.4161493, lng: -122.0812166 },
    isOpenNow: true,
    language: 'en-US',
    maxResultCount: 8,
    minRating: 3.2,
    region: 'us',
    useStrictTypeFiltering: false,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};

const { places } = await Place.searchByText(request);
```

--------------------------------------------------------------------------------

## Complete Interactive Example

The following complete example initializes a map with a search input control,
calls `Place.searchByText()` when the user submits a query, manages marker
lifecycle by clearing previous markers, renders clickable
`AdvancedMarkerElement` pins for each result, and opens an `InfoWindow` on
click.

### HTML (`index.html`)

```html
<!doctype html>
<html>
    <head>
        <title>Text Search</title>
        <link rel="stylesheet" type="text/css" href="./style.css" />
        <script type="module" src="./index.js"></script>
        <script>
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                key: "GOOGLE_MAPS_API_KEY"
            });
        </script>
    </head>
    <body>
        <div id="text-input-card">
            <input
                type="text"
                id="text-input"
                placeholder="Search for a place" />
            <input type="button" id="text-input-button" value="Search" />
        </div>
        <div id="map"></div>
    </body>
</html>
```

### CSS (`style.css`)

```css
/* Always set the map height explicitly to define the size of the div element that contains the map. */
#map {
    height: 100%;
}

/* Optional: Makes the sample page fill the window. */
html,
body {
    height: 100%;
    margin: 0;
    padding: 0;
}

#text-input-card {
    width: 25%;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    margin: 10px;
    padding: 5px;
    font-family: Roboto, sans-serif;
    font-size: large;
    font-weight: bold;
}

#text-input {
    width: 100%;
    padding: 10px;
    margin: 0;
    box-sizing: border-box;
}

#text-input-button {
    display: inline-block;
    margin-top: 0.5rem;
    width: auto;
    padding: 0.6rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
    background-color: #2563eb;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
    text-align: center;
}
```

### TypeScript (`index.ts`)

```typescript
let map: google.maps.Map;
let markers: Record<string, google.maps.marker.AdvancedMarkerElement> = {};
let infoWindow: google.maps.InfoWindow;

async function init() {
    const [{ Map, InfoWindow }, { ControlPosition }] = await Promise.all([
        google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary('core') as Promise<google.maps.CoreLibrary>,
    ]);

    const center = { lat: 37.4161493, lng: -122.0812166 };
    map = new Map(document.getElementById('map') as HTMLElement, {
        center,
        zoom: 11,
        mapTypeControl: false,
        mapId: 'DEMO_MAP_ID',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    const textInput = document.getElementById('text-input') as HTMLInputElement;
    const textInputButton = document.getElementById(
        'text-input-button'
    ) as HTMLButtonElement;
    const card = document.getElementById('text-input-card') as HTMLElement;
    map.controls[ControlPosition.TOP_LEFT].push(card);

    textInputButton.addEventListener('click', () => {
        void findPlaces(textInput.value);
    });

    textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            void findPlaces(textInput.value);
        }
    });

    infoWindow = new InfoWindow();
}

async function findPlaces(query: string) {
    const [{ Place }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
        google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
    ]);

    const request = {
        textQuery: query,
        fields: ['displayName', 'location', 'businessStatus'],
        includedType: '', // Restrict query to a specific type (leave blank for any).
        useStrictTypeFiltering: true,
        locationRestriction: map.getBounds(),
        isOpenNow: true,
        language: 'en-US',
        maxResultCount: 8,
        minRating: 1, // Specify a minimum rating.
        region: 'us',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    };

    const { places } = await Place.searchByText(request);

    if (places.length) {
        const { LatLngBounds } = (await google.maps.importLibrary(
            'core'
        )) as google.maps.CoreLibrary;
        const bounds = new LatLngBounds();

        // First remove all existing markers.
        for (const id in markers) {
            markers[id].map = null;
        }
        markers = {};

        // Loop through and get all the results.
        places.forEach((place: google.maps.places.Place) => {
            const marker = new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true,
            });
            markers[place.id] = marker;

            marker.addEventListener('gmp-click', () => {
                map.panTo(place.location!);
                updateInfoWindow(place.displayName!, place.id, marker);
            });

            if (place.location != null) {
                bounds.extend(place.location);
            }
        });

        map.fitBounds(bounds);
    } else {
        console.log('No results');
    }
}

// Helper function to create an info window.
function updateInfoWindow(
    title: string | Element | null,
    content: string | Element | null,
    anchor: google.maps.marker.AdvancedMarkerElement
) {
    infoWindow.setContent(content);
    infoWindow.setHeaderContent(title);
    infoWindow.open({
        map,
        anchor,
        shouldFocus: false,
    });
}

void init();
```

### JavaScript (`index.js`)

```javascript
let map;
let markers = {};
let infoWindow;

async function init() {
    const [{ Map, InfoWindow }, { ControlPosition }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('core'),
    ]);

    const center = { lat: 37.4161493, lng: -122.0812166 };
    map = new Map(document.getElementById('map'), {
        center,
        zoom: 11,
        mapTypeControl: false,
        mapId: 'DEMO_MAP_ID',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    const textInput = document.getElementById('text-input');
    const textInputButton = document.getElementById('text-input-button');
    const card = document.getElementById('text-input-card');
    map.controls[ControlPosition.TOP_LEFT].push(card);

    textInputButton.addEventListener('click', () => {
        void findPlaces(textInput.value);
    });

    textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            void findPlaces(textInput.value);
        }
    });

    infoWindow = new InfoWindow();
}

async function findPlaces(query) {
    const [{ Place }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('places'),
        google.maps.importLibrary('marker'),
    ]);

    const request = {
        textQuery: query,
        fields: ['displayName', 'location', 'businessStatus'],
        includedType: '', // Restrict query to a specific type (leave blank for any).
        useStrictTypeFiltering: true,
        locationRestriction: map.getBounds(),
        isOpenNow: true,
        language: 'en-US',
        maxResultCount: 8,
        minRating: 1, // Specify a minimum rating.
        region: 'us',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    };

    const { places } = await Place.searchByText(request);

    if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary('core');
        const bounds = new LatLngBounds();

        // First remove all existing markers.
        for (const id in markers) {
            markers[id].map = null;
        }
        markers = {};

        // Loop through and get all the results.
        places.forEach((place) => {
            const marker = new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true,
            });
            markers[place.id] = marker;

            marker.addEventListener('gmp-click', () => {
                map.panTo(place.location);
                updateInfoWindow(place.displayName, place.id, marker);
            });

            if (place.location != null) {
                bounds.extend(place.location);
            }
        });

        map.fitBounds(bounds);
    } else {
        console.log('No results');
    }
}

// Helper function to create an info window.
function updateInfoWindow(title, content, anchor) {
    infoWindow.setContent(content);
    infoWindow.setHeaderContent(title);
    infoWindow.open({
        map,
        anchor,
        shouldFocus: false,
    });
}

void init();
```

--------------------------------------------------------------------------------

## Fetching Additional Place Details on Demand

When you call `Place.searchByText()`, each returned `Place` object is populated
with the properties specified in `request.fields`. If you want to keep initial
search costs low (e.g., requesting only `['displayName', 'location']` for
markers) and load richer details (such as `'formattedAddress'`, `'reviews'`,
`'photos'`, or `'editorialSummary'`) only when a user selects a specific place,
call `place.fetchFields()` on that `Place` instance:

```javascript
marker.addEventListener('gmp-click', async () => {
    await place.fetchFields({
        fields: ['formattedAddress', 'rating', 'reviews', 'photos'],
    });
    updateInfoWindow(
        place.displayName,
        `${place.formattedAddress} (Rating: ${place.rating ?? 'N/A'})`,
        marker
    );
});
```

--------------------------------------------------------------------------------

## Reference Links

*   **DevSite Documentation:**
    *   [Text Search (New)](https://developers.google.com/maps/documentation/javascript/place-search)
    *   [`Place.searchByText` Reference](https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchByText)
    *   [`SearchByTextRequest` Interface](https://developers.google.com/maps/documentation/javascript/reference/place#SearchByTextRequest)
    *   [Place Class Data Fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields)
*   **Official Open Source Samples (GitHub):**
    *   [Place Text Search Sample](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-text-search/index.ts?utm_campaign=gmp_git_agentskills_v1)
    *   [Place Class (`fetchFields`) Sample](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-class/index.ts?utm_campaign=gmp_git_agentskills_v1)
    *   [Place Reviews Sample](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-reviews/index.ts?utm_campaign=gmp_git_agentskills_v1)
    *   [Place Photos Sample](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-photos/index.ts?utm_campaign=gmp_git_agentskills_v1)
