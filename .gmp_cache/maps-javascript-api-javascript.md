---
name: maps-javascript-api-javascript
description: Use this skill when building interactive 2D or photorealistic 3D maps, integrating Street View, rendering custom markers, overlays, and geospatial datasets, or implementing client-side location services in JavaScript. This skill covers the Google Maps JavaScript API, including cloud-based map styling, Places searches and UI widgets, autocomplete, directions, route matrices, geocoding, address validation, elevation queries, and Fleet Engine tracking.
license: Apache-2.0
metadata:
  version: 1.0.57
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

### Overview

The Maps JavaScript API lets you customize maps with your own content and
imagery for display on web pages and mobile devices. It provides client-side
JavaScript libraries and web components to embed interactive 2D and
photorealistic 3D maps, Street View panoramas, and rich geospatial overlays into
web applications.

Use this skill to implement client-side mapping and location features,
including:

-   **Maps & Views**: Interactive 2D maps, photorealistic 3D maps, Street View
    panoramas, camera controls, and user event handling.
-   **Markers & Overlays**: Customizable markers, 3D models, info windows,
    polylines, polygons, ground overlays, KML/GeoJSON layers, custom datasets,
    and deck.gl integrations.
-   **Map Styling**: Cloud-based map IDs, custom feature styling, data-driven
    boundary/choropleth styling, and traffic, transit, or bicycling layers.
-   **Places & UI Widgets**: Place searches, autocomplete widgets, place
    details, photos, reviews, and pre-built UI elements for displaying place
    data and AI-powered summaries.
-   **Routes & Location Services**: Directions, route matrices, isochrone travel
    time layers, geocoding, reverse geocoding, address validation, elevation
    data, and real-time Fleet Engine delivery vehicle tracking.

### Mandatory settings

Whenever generating code examples demonstrating the initialization, rendering,
or service calls for a Google Maps Platform product, you MUST configure the
usage attribution ID `gmp_git_agentskills_v1`.

Locate the target **Product** below and apply the specific syntax required for
the chosen **Platform** or **Nuance**.

#### React / JSX

```tsx
internalUsageAttributionIds={['gmp_git_agentskills_v1']}
```

#### Vanilla JS (MapOptions)

```typescript
internalUsageAttributionIds: ['gmp_git_agentskills_v1']
```

#### Vanilla JS (2D Web Component)

```typescript
{{ gmp-map internal-usage-attribution-ids="gmp_git_agentskills_v1" }}
```

#### Vanilla JS (3D Web Component)

```typescript
{{ gmp-map-3d internal-usage-attribution-ids="gmp_git_agentskills_v1" }}
```

## Primary Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced capability sub-workflow file and
satisfy its *Evidence Checkpoint* before advancing.

### Phase 1: Core Initialization & Base Setup (Primary)

-   [ ] **Step 1.1: Loads the Maps JavaScript API bootstrap script and
    initializes a 2D/vector interactive Google Map instance in a DOM
    container.** Read
    [references/add-customizable-interactive-map-web-page-or-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-customizable-interactive-map-web-page-or-mobile-app.md).
    *Trigger Condition*: Use whenever initializing a standard 2D or vector
    Google Map on a web page. *Evidence Checkpoint*: Maps JavaScript API loader
    is present, importLibrary('maps') resolves, and a google.maps.Map or gmp-map
    element renders with center and zoom.
-   [ ] **Step 1.2: Loads the maps3d library and initializes an interactive
    Photorealistic 3D Map (Map3DElement / gmp-map-3d) on a web page.** Read
    [references/add-interactive-photorealistic-3d-map-web-page.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-interactive-photorealistic-3d-map-web-page.md).
    *Trigger Condition*: Use whenever the user wants to create or embed a
    Photorealistic 3D Map in JavaScript. *Evidence Checkpoint*:
    importLibrary('maps3d') resolves and a Map3DElement (gmp-map-3d) is
    initialized with center, range, tilt, heading, and mode.

### Phase 2: Feature Layer & Custom Enrichment (Supplemental)

#### Feature Module: Places (Optional - Use-Case Dependent)

-   [ ] **Returns a validated and standardized address for a specified full or
    partial address.** Read
    [references/return-validated-address-specified-address-or-partial-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-validated-address-specified-address-or-partial-address.md).
    *Trigger Condition*: Use when the user needs to validate, standardize, or
    correct an input address string. *Evidence Checkpoint*: Address validation
    response returns a structured result with standardized address components.
-   [ ] **Extracts the latitude and longitude coordinates for a validated
    address.** Read
    [references/return-latitudelongitude-coordinates-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-latitudelongitude-coordinates-validated-address.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user needs geographic coordinates from an
    address validation response. *Evidence Checkpoint*: Geocode location
    coordinates (latitude and longitude) are extracted from the validated
    address payload.
-   [ ] **Returns the unique Google Place ID associated with a validated
    address.** Read
    [references/return-google-place-identifier-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-google-place-identifier-validated-address.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user wants to retrieve the Place ID for a
    validated address. *Evidence Checkpoint*: Place ID string is retrieved from
    the address validation geocode output.
-   [ ] **Enables USPS CASS certification processing for US and Puerto Rico
    address validation requests.** Read
    [references/use-united-states-postal-service-usps-coding-accuracy-support-system-cass-certification-address-vali.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/use-united-states-postal-service-usps-coding-accuracy-support-system-cass-certification-address-vali.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user requires official USPS CASS
    validation for US addresses. *Evidence Checkpoint*: Request payload enables
    USPS CASS and response includes CASS-verified postal fields.
-   [ ] **Identifies whether a validated address is a residential, commercial,
    or PO Box location.** Read
    [references/return-information-about-whether-validated-address-is-business-residence-or-po-box.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-information-about-whether-validated-address-is-business-residence-or-po-box.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user needs to classify an address as a
    business, residence, or PO Box. *Evidence Checkpoint*: Validation metadata
    returns residential, business, or PO Box indicators.
-   [ ] **Retrieves USPS delivery metadata such as DPV confirmation, carrier
    route, and eLOT information for a validated address.** Read
    [references/return-united-states-postal-service-usps-delivery-metadata-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-united-states-postal-service-usps-delivery-metadata-validated-address.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user requests USPS delivery point
    validation or postal metadata. *Evidence Checkpoint*: Response contains the
    uspsData object with delivery metadata fields.
-   [ ] **Returns an English-language or Latin-script version of a validated
    address.** Read
    [references/return-english-language-version-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-english-language-version-validated-address.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user needs an English or Latin-script
    formatted version of an international address. *Evidence Checkpoint*:
    Response includes the englishLatinAddress object with localized Latin-script
    components.
-   [ ] **Returns the Open Location Code (Plus Code) for a validated address.**
    Read
    [references/return-plus-code-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-plus-code-validated-address.md).
    *Dependencies*:
    `["references/return-validated-address-specified-address-or-partial-address.md"]` \
    *Trigger Condition*: Use when the user needs the Plus Code corresponding to
    a validated address. *Evidence Checkpoint*: Plus Code global and compound
    codes are retrieved from the validation geocode response.
-   [ ] **Converts a street address or place name into geographic latitude and
    longitude coordinates (geocoding).** Read
    [references/return-latitudelongitude-coordinates-address-geocoding.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-latitudelongitude-coordinates-address-geocoding.md).
    *Trigger Condition*: Use when the user wants to geocode an address or place
    name into coordinates. *Evidence Checkpoint*: Geocoder.geocode resolves the
    address and returns geometry.location coordinates.
-   [ ] **Converts geographic latitude and longitude coordinates into a
    human-readable address (reverse geocoding).** Read
    [references/return-address-set-latitudelongitude-coordinates-reverse-geocoding.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-address-set-latitudelongitude-coordinates-reverse-geocoding.md).
    *Trigger Condition*: Use when the user wants to find the street address or
    place corresponding to a lat/lng coordinate. *Evidence Checkpoint*:
    Geocoder.geocode with a location parameter returns formatted addresses and
    Place IDs.
-   [ ] **Searches for places matching a free-text query string using
    Place.searchByText.** Read
    [references/return-list-places-and-place-details-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-list-places-and-place-details-based-query-string.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to search for places by text
    query (e.g., 'pizza in New York') using the Places library. *Evidence
    Checkpoint*: Place.searchByText is called with textQuery and fields,
    returning an array of Place instances.
-   [ ] **Searches for places within a specified geographic area using
    Place.searchNearby.** Read
    [references/return-list-places-and-place-details-near-specific-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-list-places-and-place-details-near-specific-location.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to find places near a specific
    coordinate or within a radius. *Evidence Checkpoint*: Place.searchNearby is
    called with locationRestriction and fields, returning nearby Place
    instances.
-   [ ] **Programmatically fetches place autocomplete predictions for a user
    query using AutocompleteSuggestion.fetchAutocompleteSuggestions.** Read
    [references/return-autocomplete-results-about-places-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-autocomplete-results-about-places-based-query-string.md).
    *Trigger Condition*: Use when the user wants programmatic autocomplete
    predictions without using the prebuilt UI widget. *Evidence Checkpoint*:
    AutocompleteSuggestion.fetchAutocompleteSuggestions returns place
    predictions and supports session tokens.
-   [ ] **Retrieves detailed attributes (name, address, opening hours, phone,
    location) for a specific Place ID using place.fetchFields.** Read
    [references/return-detailed-information-about-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-detailed-information-about-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to fetch details about a
    specific place using its Place ID. *Evidence Checkpoint*: new
    google.maps.places.Place({ id }) followed by place.fetchFields({ fields })
    populates the requested properties.
-   [ ] **Retrieves photo objects and image URLs for a specific place via the
    Places library.** Read
    [references/return-photos-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-photos-specific-place.md).
    *Dependencies*:
    `["references/return-detailed-information-about-specific-place.md"]` \
    *Trigger Condition*: Use when the user wants to display photos of a place.
    *Evidence Checkpoint*: place.fetchFields includes 'photos' and
    photo.getURI() generates the image URL.
-   [ ] **Specifies maximum width or height dimensions when generating a Place
    photo URI.** Read
    [references/resize-place-photos.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/resize-place-photos.md).
    *Dependencies*: `["references/return-photos-specific-place.md"]` \
    *Trigger Condition*: Use when the user wants to control the resolution or
    dimensions of fetched place photos. *Evidence Checkpoint*: photo.getURI({
    maxWidth, maxHeight }) is called with explicit pixel dimension constraints.
-   [ ] **Retrieves overall star ratings, user rating counts, and individual
    customer reviews for a place.** Read
    [references/return-ratings-and-reviews-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-ratings-and-reviews-specific-place.md).
    *Dependencies*:
    `["references/return-detailed-information-about-specific-place.md"]` \
    *Trigger Condition*: Use when the user wants to fetch star ratings or user
    reviews for a place. *Evidence Checkpoint*: place.fetchFields requests
    'rating', 'userRatingCount', or 'reviews' and accesses the returned data.
-   [ ] **Adds a PlaceAutocompleteElement (gmp-place-autocomplete) widget to a
    web page for interactive place and address search.** Read
    [references/add-autocomplete-widget-web-page-or-app-that-returns-results-about-places-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-autocomplete-widget-web-page-or-app-that-returns-results-about-places-based-query-string.md).
    *Trigger Condition*: Use when the user wants to add a Place Autocomplete
    search input box to their UI. *Evidence Checkpoint*:
    PlaceAutocompleteElement is added to the DOM and listens for the gmp-select
    event to retrieve the selected Place.
-   [ ] **Filters Place Search and Autocomplete requests by included or excluded
    place types (e.g., restaurant, cafe, hotel).** Read
    [references/specify-place-types-include-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-place-types-include-place-information-responses.md).
    *Trigger Condition*: Use when the user wants to filter place search or
    autocomplete results to specific categories or business types. *Evidence
    Checkpoint*: Request includes includedTypes, excludedTypes, or
    includedPrimaryTypes parameters.
-   [ ] **Adds a Places UI Kit component that renders AI-powered place summaries
    and reviews on a web page.** Read
    [references/add-ui-element-that-displays-ai-powered-summaries-and-reviews-about-specific-places-web-page-or-mobi.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-ui-element-that-displays-ai-powered-summaries-and-reviews-about-specific-places-web-page-or-mobi.md).
    *Dependencies*:
    `["references/add-ui-element-that-displays-information-about-specific-place-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to display AI-generated
    summaries and review overviews using Places UI Kit web components. *Evidence
    Checkpoint*: Places UI Kit component is rendered in the DOM and configured
    with a valid Place or Place ID.
-   [ ] **Customizes the visual appearance, colors, and typography of Places UI
    Kit elements using CSS custom properties.** Read
    [references/apply-css-styling-place-data-ui-element.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-css-styling-place-data-ui-element.md).
    *Trigger Condition*: Use when the user wants to style Places UI Kit
    components using CSS variables. *Evidence Checkpoint*: Custom CSS properties
    (--gmp-*) are applied to the Places UI Kit element selector.
-   [ ] **Configures layout, content visibility, and styling options for Places
    UI Kit components.** Read
    [references/customize-place-data-ui-element-styling-and-configurations-ui-element-customization-tool.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-place-data-ui-element-styling-and-configurations-ui-element-customization-tool.md).
    *Trigger Condition*: Use when the user wants to customize which content
    elements appear inside a Places UI Kit component. *Evidence Checkpoint*:
    Places UI Kit component is configured with custom content child elements and
    styling attributes.
-   [ ] **Embeds the Places UI Kit Place Details element (gmp-place-details /
    gmp-place-details-compact) to display rich information about a specific
    place.** Read
    [references/add-ui-element-that-displays-information-about-specific-place-web-page-or-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-ui-element-that-displays-information-about-specific-place-web-page-or-mobile-app.md).
    *Trigger Condition*: Use when the user wants a prebuilt UI component to
    display details for a place (and for EEA compliance when showing place data
    on a map). *Evidence Checkpoint*: Places UI Kit details element is loaded
    from the places library and configured with a place request.
-   [ ] **Embeds the Places UI Kit Place Search element configured with a text
    search request to display a list of matching places.** Read
    [references/add-ui-element-that-displays-list-places-based-query-string-web-page.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-ui-element-that-displays-list-places-based-query-string-web-page.md).
    *Trigger Condition*: Use when the user wants a prebuilt UI list component
    showing places from a text query. *Evidence Checkpoint*: gmp-place-search
    element is rendered with a gmp-place-text-search-request child.
-   [ ] **Embeds the Places UI Kit Place Search element configured with a nearby
    search request to display a list of places near a location.** Read
    [references/add-ui-element-that-displays-list-places-near-specific-location-web-page.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-ui-element-that-displays-list-places-near-specific-location-web-page.md).
    *Trigger Condition*: Use when the user wants a prebuilt UI list component
    showing places near a geographic location. *Evidence Checkpoint*:
    gmp-place-search element is rendered with a gmp-place-nearby-search-request
    child.
-   [ ] **Adds a Places UI Kit basic autocomplete element that returns Google
    Place IDs for user search queries.** Read
    [references/add-basic-autocomplete-ui-element-web-page-or-app-that-returns-google-place-identifiers-based-query.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-basic-autocomplete-ui-element-web-page-or-app-that-returns-google-place-identifiers-based-query.md).
    *Trigger Condition*: Use when the user wants a lightweight Places UI Kit
    autocomplete input that returns a Place ID on selection. *Evidence
    Checkpoint*: Basic autocomplete UI element is added to the DOM and returns
    the selected Place ID via its selection event.
-   [ ] **Displays an isochrone (travel-time reachability) polygon layer on a
    map showing the area reachable from an origin within a given duration and
    travel mode.** Read
    [references/add-data-layer-map-that-shows-area-isochrone-that-person-can-reach-specified-origin-point-within-spe.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-data-layer-map-that-shows-area-isochrone-that-person-can-reach-specified-origin-point-within-spe.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to visualize a travel-time
    catchment area or isochrone polygon on the map. *Evidence Checkpoint*:
    Isochrone boundary data is calculated/loaded and rendered as a polygon data
    layer on the map.

#### Feature Module: Maps (Optional - Use-Case Dependent)

-   [ ] **Creates a reusable, cloud-based map style in the Google Cloud Console
    to apply across platforms.** Read
    [references/create-reusable-cross-platform-map-style.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-cross-platform-map-style.md).
    *Dependencies*:
    `["references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md"]` \
    *Trigger Condition*: Use when the user wants to create and manage a
    cloud-based map style. *Evidence Checkpoint*: Map style is created and
    associated with a Map ID in Google Cloud Console.
-   [ ] **Customizes the visual appearance of roads, polylines, and polygon
    features on a map.** Read
    [references/change-style-roads-polylines-and-polygons-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-roads-polylines-and-polygons-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to change the colors, strokes,
    or fills of roads and map polygons. *Evidence Checkpoint*: Map styling rules
    or cloud style configurations apply custom colors to roads and polygons.
-   [ ] **Controls the visibility of specific map features such as points of
    interest, transit, or administrative labels.** Read
    [references/display-or-hide-map-features.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/display-or-hide-map-features.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to hide or show specific base
    map elements. *Evidence Checkpoint*: Map style rules set feature visibility
    to on, off, or simplified.
-   [ ] **Modifies the colors, outlines, and visibility of icons and text labels
    on the map.** Read
    [references/change-style-icons-and-text-labels-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-icons-and-text-labels-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to customize the styling of map
    text labels or feature icons. *Evidence Checkpoint*: Map style rules apply
    text fill, stroke, and icon color adjustments.
-   [ ] **Configures cloud-based map styles to change dynamically across
    different zoom levels.** Read
    [references/apply-different-map-styles-different-zoom-levels.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-different-map-styles-different-zoom-levels.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md"]` \
    *Trigger Condition*: Use when the user wants map feature styles to vary
    depending on the current zoom level. *Evidence Checkpoint*: Zoom-level
    keyframe styles are configured and transition smoothly as the map zooms.
-   [ ] **Adjusts the density of displayed points of interest (POIs) and places
    on the map.** Read
    [references/change-density-places-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-density-places-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to increase or decrease the
    number of POI icons shown on the map. *Evidence Checkpoint*: POI density
    setting is configured in the map style to control place marker clutter.
-   [ ] **Customizes the appearance and 3D extrusion styling of building
    footprints on the map.** Read
    [references/change-style-buildings-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-buildings-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to style building footprints or
    3D buildings on the map. *Evidence Checkpoint*: Building feature styles
    reflect custom fill colors and extrusion settings.
-   [ ] **Customizes the display and styling of prominent landmark features on
    the map.** Read
    [references/change-style-landmarks-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-landmarks-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to alter the visibility or
    styling of map landmarks. *Evidence Checkpoint*: Landmark styling rules are
    applied to the map instance.
-   [ ] **Styles administrative boundaries such as countries, states,
    localities, and postal codes using Data-driven styling.** Read
    [references/change-style-boundaries-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-boundaries-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md"]` \
    *Trigger Condition*: Use when the user wants to highlight or style
    geographic/administrative boundaries on the map. *Evidence Checkpoint*:
    FeatureLayer for the target boundary type applies a custom style function or
    options object.
-   [ ] **Handles click and mouse movement events on data-driven administrative
    boundary polygons.** Read
    [references/respond-user-interactions-boundaries-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-boundaries-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/change-style-boundaries-map.md"]` \
    *Trigger Condition*: Use when the user wants interactive click or hover
    behavior on map boundary regions. *Evidence Checkpoint*: Event listeners on
    the boundary FeatureLayer trigger callbacks with feature place IDs and
    metadata.
-   [ ] **Applies color-coded choropleth styling to administrative boundaries
    based on external data values.** Read
    [references/add-choropleth-styling-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-choropleth-styling-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/change-style-boundaries-map.md"]` \
    *Trigger Condition*: Use when the user wants to build a thematic or
    choropleth map across regions. *Evidence Checkpoint*: Boundary FeatureLayer
    dynamically colors regions according to data values mapped to Place IDs.
-   [ ] **Renders KML and KMZ geographic data files as a layer on the map.**
    Read
    [references/add-kml-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-kml-layer-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to display a KML or KMZ file on
    the map. *Evidence Checkpoint*: google.maps.KmlLayer is instantiated with a
    public URL and bound to the map instance.
-   [ ] **Overlays GeoRSS feed items onto the map using KmlLayer.** Read
    [references/add-geo-rss-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-geo-rss-layer-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to render a GeoRSS feed on the
    map. *Evidence Checkpoint*: google.maps.KmlLayer loads the GeoRSS feed URL
    and renders features on the map.
-   [ ] **Loads and displays GeoJSON features on the map using the Data layer.**
    Read
    [references/add-geo-json-data-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-geo-json-data-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to import, display, or style
    GeoJSON points, lines, or polygons on a map. *Evidence Checkpoint*:
    map.data.loadGeoJson or map.data.addGeoJson renders the GeoJSON features
    onto the map.
-   [ ] **Creates and uploads a custom geospatial dataset in Google Cloud
    Console for data-driven styling.** Read
    [references/create-reusable-cross-platform-geospatial-dataset.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-cross-platform-geospatial-dataset.md).
    *Dependencies*:
    `["references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md"]` \
    *Trigger Condition*: Use when the user wants to upload custom geospatial
    data (GeoJSON, CSV, KML) to Google Cloud for map rendering. *Evidence
    Checkpoint*: Dataset is created in Cloud Console with a valid Dataset ID and
    associated with a Map Style.
-   [ ] **Displays a cloud-hosted custom geospatial dataset layer on the map.**
    Read
    [references/add-custom-geospatial-dataset-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-custom-geospatial-dataset-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/create-reusable-cross-platform-geospatial-dataset.md"]` \
    *Trigger Condition*: Use when the user wants to render a Maps Dataset on a
    vector map using its Dataset ID. *Evidence Checkpoint*:
    map.getDatasetFeatureLayer(datasetId) retrieves the dataset layer and
    renders features on the map.
-   [ ] **Applies dynamic styling to points, lines, and polygons in a custom
    geospatial dataset layer.** Read
    [references/change-style-custom-dataset-features-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-custom-dataset-features-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/add-custom-geospatial-dataset-map.md"]` \
    *Trigger Condition*: Use when the user wants to style features in a Maps
    Dataset based on feature attributes. *Evidence Checkpoint*: Style function
    assigned to the dataset FeatureLayer styles features using dataset
    attributes.
-   [ ] **Handles click and pointer events on custom geospatial dataset features
    on the map.** Read
    [references/respond-user-interactions-custom-dataset-features-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-custom-dataset-features-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/add-custom-geospatial-dataset-map.md"]` \
    *Trigger Condition*: Use when the user wants to make custom dataset features
    interactive on click or hover. *Evidence Checkpoint*: Event listener on the
    dataset FeatureLayer captures user clicks and accesses dataset feature
    properties.
-   [ ] **Retrieves the surface elevation in meters above sea level for one or
    more discrete geographic coordinates.** Read
    [references/return-elevation-set-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-elevation-set-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user needs the elevation or altitude of
    specific latitude/longitude points. *Evidence Checkpoint*:
    ElevationService.getElevationForLocations returns elevation and resolution
    values for the requested points.
-   [ ] **Samples elevation data at equidistant intervals along a path defined
    by two or more coordinates.** Read
    [references/return-difference-elevation-along-path-between-two-or-more-sets-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-difference-elevation-along-path-between-two-or-more-sets-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user wants an elevation profile or
    elevation changes along a line or path. *Evidence Checkpoint*:
    ElevationService.getElevationAlongPath returns an array of sampled elevation
    points along the path.
-   [ ] **Displays an InfoWindow popup with HTML or text content anchored to a
    marker or map coordinate.** Read
    [references/add-info-window-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-info-window-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to show a popup bubble or
    tooltip on the map or when clicking a marker. *Evidence Checkpoint*:
    google.maps.InfoWindow is instantiated and opened on the map or anchored to
    a marker.
-   [ ] **Draws vector polylines, polygons, rectangles, and circles on the
    map.** Read
    [references/add-shape-or-line-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-shape-or-line-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to draw lines, routes,
    polygons, circles, or bounding boxes on the map. *Evidence Checkpoint*:
    Polyline, Polygon, Circle, or Rectangle instance is created with coordinates
    and bound to the map.
-   [ ] **Adds SVG path symbols and vector icons to markers or polylines
    (including dashed or arrowed lines).** Read
    [references/add-vector-based-icon-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-vector-based-icon-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to add vector symbols, arrows,
    or animated icons along polylines or markers. *Evidence Checkpoint*:
    google.maps.Symbol with an SVG path or predefined symbol path is attached to
    a marker or polyline.
-   [ ] **Integrates WebGL-powered deck.gl visualization layers with the Google
    Map using GoogleMapsOverlay.** Read
    [references/add-deckgl-overlays-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-deckgl-overlays-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to render large-scale data
    visualizations or deck.gl layers on a Google Map. *Evidence Checkpoint*:
    GoogleMapsOverlay instance is initialized with deck.gl layers and attached
    via overlay.setMap(map).
-   [ ] **Places a georeferenced image overlay or custom DOM OverlayView
    anchored to geographic bounds on the map.** Read
    [references/add-overlay-image-grounded-surface-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-overlay-image-grounded-surface-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to overlay a floor plan,
    historical map image, or custom HTML element tied to map coordinates.
    *Evidence Checkpoint*: GroundOverlay or custom OverlayView is instantiated
    with geographic bounds and attached to the map.
-   [ ] **Adds custom raster image tiles or a custom ImageMapType layer over the
    base map or as a standalone map type.** Read
    [references/add-custom-tile-overlay-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-custom-tile-overlay-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to load custom map tiles (XYZ
    tile servers) onto the map. *Evidence Checkpoint*: ImageMapType or custom
    MapType is defined and pushed to map.overlayMapTypes or map.mapTypes.
-   [ ] **Creates and configures a Map ID to enable vector maps, Advanced
    Markers, cloud styling, and data-driven layers.** Read
    [references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when a feature requires a Map ID (such as Advanced
    Markers, vector maps, or cloud styling). *Evidence Checkpoint*: Map instance
    is initialized with a mapId option.
-   [ ] **Attaches event listeners to the map to handle user clicks, camera
    changes, bounds updates, and idle states.** Read
    [references/respond-user-interactions-and-events-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to detect clicks on the map or
    respond to zoom, pan, or bounds changes. *Evidence Checkpoint*:
    map.addListener registers callbacks for map events (e.g., click, idle,
    bounds_changed).
-   [ ] **Configures, positions, or hides built-in UI controls (zoom, street
    view, map type, fullscreen) and adds custom HTML controls to the map.** Read
    [references/customize-controls-that-appear-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-controls-that-appear-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to enable, disable, reposition,
    or add custom UI buttons on the map. *Evidence Checkpoint*: MapOptions
    configure control booleans/positions or custom DOM elements are pushed to
    map.controls.
-   [ ] **Programmatically controls the map camera center, zoom, tilt, heading,
    bounds, and gesture restrictions.** Read
    [references/control-zoom-and-pan-map-camera.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-zoom-and-pan-map-camera.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to pan, zoom, fit bounds,
    rotate, tilt, or restrict the map viewport. *Evidence Checkpoint*: Camera
    methods (panTo, setZoom, fitBounds, moveCamera) or restriction options
    update the map viewport.
-   [ ] **Switches the base map type between roadmap, satellite, hybrid, and
    terrain.** Read
    [references/change-map-type.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-map-type.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to display satellite imagery,
    terrain, or hybrid views on the map. *Evidence Checkpoint*: mapTypeId is set
    to roadmap, satellite, hybrid, or terrain.
-   [ ] **Configures the map color scheme to Light, Dark, or Follow System
    mode.** Read
    [references/change-map-color-scheme.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-map-color-scheme.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants a dark mode map or wants the
    map theme to match system light/dark settings. *Evidence Checkpoint*:
    colorScheme option is set using google.maps.ColorScheme (LIGHT, DARK, or
    FOLLOW_SYSTEM) during map initialization.
-   [ ] **Sets the language and region bias for map labels, controls, and
    geocoding/directions requests.** Read
    [references/localize-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/localize-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants the map displayed in a specific
    language or tailored to a specific country/region. *Evidence Checkpoint*:
    Maps JavaScript API loader is configured with language and region
    parameters.
-   [ ] **Overlays real-time traffic conditions onto the map.** Read
    [references/add-traffic-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-traffic-layer-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to display live traffic
    congestion overlays on the map. *Evidence Checkpoint*:
    google.maps.TrafficLayer is instantiated and bound to the map via
    setMap(map).
-   [ ] **Overlays public transit network lines and stations onto the map.**
    Read
    [references/add-transit-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-transit-layer-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to highlight public transit
    routes on the map. *Evidence Checkpoint*: google.maps.TransitLayer is
    instantiated and bound to the map via setMap(map).
-   [ ] **Overlays bike paths, dedicated bike lanes, and cycle-friendly roads
    onto the map.** Read
    [references/add-bicycling-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-bicycling-layer-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to display bicycling routes and
    bike lanes on the map. *Evidence Checkpoint*: google.maps.BicyclingLayer is
    instantiated and bound to the map via setMap(map).
-   [ ] **Places an AdvancedMarkerElement on a 2D or vector map at specified
    coordinates.** Read
    [references/add-marker-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md"]` \
    *Trigger Condition*: Use when the user wants to add pins or markers to a
    map. *Evidence Checkpoint*: marker library is imported, map has a mapId, and
    AdvancedMarkerElement is created with position and map.
-   [ ] **Customizes AdvancedMarkerElement appearance using PinElement (colors,
    glyph, scale), custom images, SVGs, or interactive HTML content.** Read
    [references/customize-marker-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/add-marker-map.md"]` \
    *Trigger Condition*: Use when the user wants custom marker colors, custom
    icons, glyphs, or HTML markers on the map. *Evidence Checkpoint*: PinElement
    or custom DOM element is assigned to the content property of
    AdvancedMarkerElement.
-   [ ] **Handles click, drag, and keyboard accessibility events on map
    markers.** Read
    [references/respond-user-interactions-markers-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-markers-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md",
    "references/add-marker-map.md"]` \
    *Trigger Condition*: Use when the user wants markers to respond to clicks,
    dragging, or user interaction. *Evidence Checkpoint*: Event listener (such
    as gmp-click or dragend) is attached to the AdvancedMarkerElement.
-   [ ] **Adds a 3D marker (Marker3DElement or Marker3DInteractiveElement) to a
    Photorealistic 3D Map, including altitude and extrusion options.** Read
    [references/add-marker-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to place a pin or marker on a
    Photorealistic 3D Map. *Evidence Checkpoint*: Marker3DElement or
    Marker3DInteractiveElement is instantiated with position and appended to the
    Map3DElement.
-   [ ] **Customizes markers on a Photorealistic 3D Map using PinElement, custom
    raster images, or SVG templates.** Read
    [references/customize-marker-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md",
    "references/add-marker-photorealistic-3d-map.md"]` \
    *Trigger Condition*: Use when the user wants to change the icon, color,
    glyph, or scale of a marker on a 3D map. *Evidence Checkpoint*: PinElement
    or template containing an img/svg is appended to the Marker3DElement.
-   [ ] **Renders a glTF/GLB 3D model on a Photorealistic 3D Map using
    Model3DElement.** Read
    [references/add-3d-model-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-3d-model-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to place a custom 3D model
    (.glb or .gltf) into a Photorealistic 3D Map scene. *Evidence Checkpoint*:
    Model3DElement is configured with src, position, orientation, and scale, and
    appended to the Map3DElement.
-   [ ] **Displays a popover or info overlay anchored to a coordinate or
    interactive marker on a Photorealistic 3D Map.** Read
    [references/add-overlay-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-overlay-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to show a popup or HTML overlay
    card in a Photorealistic 3D Map. *Evidence Checkpoint*: PopoverElement is
    created, linked to a position or marker, and appended to the Map3DElement.
-   [ ] **Draws 3D lines and extruded paths on a Photorealistic 3D Map using
    Polyline3DElement.** Read
    [references/add-3d-polyline-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-3d-polyline-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to render a 3D route, path, or
    extruded line on a Photorealistic 3D Map. *Evidence Checkpoint*:
    Polyline3DElement is configured with coordinates, stroke options, and
    altitudeMode, and appended to Map3DElement.
-   [ ] **Draws 3D polygons and extruded volumes on a Photorealistic 3D Map
    using Polygon3DElement.** Read
    [references/add-3d-polygon-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-3d-polygon-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to draw a 3D polygon or
    extruded shape on a Photorealistic 3D Map. *Evidence Checkpoint*:
    Polygon3DElement is initialized with outerCoordinates, styling, and
    altitudeMode, and appended to Map3DElement.
-   [ ] **Listens for user clicks, camera state changes, and animation
    completion events on a Photorealistic 3D Map and its 3D elements.** Read
    [references/respond-user-interactions-and-events-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to handle click events or
    camera change events on a Photorealistic 3D Map. *Evidence Checkpoint*:
    addEventListener attaches handlers for gmp-click, gmp-steadystate, or camera
    property change events on Map3DElement.
-   [ ] **Configures UI controls and map mode (hybrid vs satellite labels) on a
    Photorealistic 3D Map.** Read
    [references/customize-controls-that-appear-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-controls-that-appear-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to toggle UI controls or label
    visibility on a Photorealistic 3D Map. *Evidence Checkpoint*: Map3DElement
    mode and UI control properties are configured.
-   [ ] **Animates the 3D camera using flyCameraTo and flyCameraAround on a
    Photorealistic 3D Map.** Read
    [references/control-camera-path-and-animations-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-camera-path-and-animations-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants smooth camera fly-to animations
    or orbital camera rotation on a 3D map. *Evidence Checkpoint*:
    map3D.flyCameraTo or map3D.flyCameraAround executes with endCamera and
    durationMillis.
-   [ ] **Restricts the camera bounds, altitude, tilt, and heading ranges on a
    Photorealistic 3D Map.** Read
    [references/control-camera-restrictions-photorealistic-3d-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-camera-restrictions-photorealistic-3d-map.md).
    *Dependencies*:
    `["references/add-interactive-photorealistic-3d-map-web-page.md"]` \
    *Trigger Condition*: Use when the user wants to constrain camera movement,
    zoom/altitude limits, or geographic bounds on a 3D map. *Evidence
    Checkpoint*: Map3DElement bounds, minAltitude, maxAltitude, minTilt, or
    maxTilt properties are set.
-   [ ] **Initializes an interactive 360-degree Google Street View panorama in a
    DOM container or linked to a map.** Read
    [references/add-configurable-interactive-google-street-view-web-page-or-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-configurable-interactive-google-street-view-web-page-or-mobile-app.md).
    *Trigger Condition*: Use when the user wants to embed an interactive Street
    View panorama on a web page. *Evidence Checkpoint*:
    google.maps.StreetViewPanorama is instantiated in a container with position
    and pov (heading/pitch).
-   [ ] **Renders markers and InfoWindows directly inside a Street View
    panorama.** Read
    [references/add-marker-or-overlay-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-or-overlay-google-street-view.md).
    *Dependencies*:
    `["references/add-configurable-interactive-google-street-view-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants markers or popups to appear
    inside the 360-degree Street View view. *Evidence Checkpoint*: Marker or
    InfoWindow is bound to the StreetViewPanorama instance.
-   [ ] **Handles events in Street View such as panorama ID changes, position
    changes, POV (heading/pitch) updates, and link changes.** Read
    [references/respond-user-interactions-and-events-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-google-street-view.md).
    *Dependencies*:
    `["references/add-configurable-interactive-google-street-view-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to track camera orientation,
    movement, or panorama changes in Street View. *Evidence Checkpoint*:
    panorama.addListener registers callbacks for pano_changed, position_changed,
    or pov_changed.
-   [ ] **Configures the visibility and positioning of navigation, pan, zoom,
    address, and fullscreen controls in Street View.** Read
    [references/customize-controls-that-appear-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-controls-that-appear-google-street-view.md).
    *Dependencies*:
    `["references/add-configurable-interactive-google-street-view-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to customize or hide the
    on-screen controls inside Street View. *Evidence Checkpoint*:
    StreetViewPanoramaOptions set control visibility flags (e.g.,
    addressControl, linksControl, panControl).
-   [ ] **Queries StreetViewService to programmatically retrieve panorama
    metadata and check Street View availability at a location.** Read
    [references/return-google-street-view-panorama-specific-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-google-street-view-panorama-specific-location.md).
    *Trigger Condition*: Use when the user wants to check if Street View exists
    at a coordinate or fetch panorama metadata programmatically. *Evidence
    Checkpoint*: StreetViewService.getPanorama resolves with
    StreetViewPanoramaData for the requested location or pano ID.

#### Feature Module: Routes (Optional - Use-Case Dependent)

-   [ ] **Calculates a route between locations and returns the geographic
    coordinates for each step along the path.** Read
    [references/return-directions-between-two-or-more-latitudelongitude-coordinates-as-series-coordinates-each-step.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-directions-between-two-or-more-latitudelongitude-coordinates-as-series-coordinates-each-step.md).
    *Trigger Condition*: Use when the user needs step-by-step coordinate paths
    for directions between locations. *Evidence Checkpoint*: Route response
    returns legs and steps containing start, end, and path coordinates.
-   [ ] **Calculates directions and returns turn-by-turn navigation instructions
    and maneuver descriptions for each step.** Read
    [references/return-directions-between-two-or-more-sets-latitudelongitude-coordinates-as-series-maneuver-descript.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-directions-between-two-or-more-sets-latitudelongitude-coordinates-as-series-maneuver-descript.md).
    *Trigger Condition*: Use when the user needs human-readable turn-by-turn
    directions between locations. *Evidence Checkpoint*: Route steps contain
    navigation instruction text and maneuver types.
-   [ ] **Retrieves the individual distance for each step along a calculated
    route.** Read
    [references/return-distance-between-each-step-along-route-between-two-or-more-sets-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-distance-between-each-step-along-route-between-two-or-more-sets-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user wants the distance breakdown for each
    turn-by-turn step in a route. *Evidence Checkpoint*: Each step object in the
    route response includes distance values.
-   [ ] **Retrieves the estimated travel duration for each individual step along
    a route.** Read
    [references/return-travel-time-between-each-step-along-route-between-two-or-more-sets-latitudelongitude-coordina.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-travel-time-between-each-step-along-route-between-two-or-more-sets-latitudelongitude-coordina.md).
    *Trigger Condition*: Use when the user needs the duration of each step in a
    route. *Evidence Checkpoint*: Each step object in the route response
    includes duration values.
-   [ ] **Returns the encoded polyline geometry string for each individual step
    of a route.** Read
    [references/return-encoded-polyline-between-each-step-along-route-between-two-or-more-set-latitudelongitude-coor.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-encoded-polyline-between-each-step-along-route-between-two-or-more-set-latitudelongitude-coor.md).
    *Trigger Condition*: Use when the user needs encoded polylines at the
    individual step level of a route. *Evidence Checkpoint*: Each route step
    includes an encoded polyline string representing its segment geometry.
-   [ ] **Calculates the total travel distance for a route and its legs between
    origin and destination coordinates.** Read
    [references/return-distance-route-between-two-or-more-sets-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-distance-route-between-two-or-more-sets-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user needs the total distance of a route
    between locations. *Evidence Checkpoint*: Route response returns total
    distance in meters and localized text.
-   [ ] **Calculates the total estimated travel time for a route between origin
    and destination coordinates.** Read
    [references/return-travel-time-route-between-two-or-more-sets-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-travel-time-route-between-two-or-more-sets-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user needs the total travel duration for a
    route. *Evidence Checkpoint*: Route response includes the overall duration
    and leg durations.
-   [ ] **Returns an overall encoded polyline string representing the entire
    route geometry.** Read
    [references/return-encoded-polyline-route-between-two-or-more-sets-latitudelongitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-encoded-polyline-route-between-two-or-more-sets-latitudelongitude-coordinates.md).
    *Trigger Condition*: Use when the user wants to draw or store the full path
    of a calculated route. *Evidence Checkpoint*: Route response includes the
    overview encoded polyline or path coordinates.
-   [ ] **Configures the mode of transportation (driving, walking, bicycling,
    transit, or two-wheeler) for a route calculation.** Read
    [references/specify-travel-mode-drive-transit-walk-two-wheeled-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-travel-mode-drive-transit-walk-two-wheeled-route-request.md).
    *Trigger Condition*: Use when the user wants directions for a specific
    travel mode like walking, transit, cycling, or driving. *Evidence
    Checkpoint*: Route request specifies the travelMode parameter and returns
    mode-appropriate directions.
-   [ ] **Adds intermediate stopover or pass-through waypoints to a route
    request, optionally optimizing waypoint order.** Read
    [references/specify-stop-or-pass-through-point-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-stop-or-pass-through-point-route-request.md).
    *Trigger Condition*: Use when the user wants a route that visits or passes
    through intermediate locations. *Evidence Checkpoint*: Route request
    includes intermediate waypoints and calculates legs through the specified
    points.
-   [ ] **Configures traffic-aware routing, departure times, and traffic models
    (best guess, pessimistic, optimistic) for driving routes.** Read
    [references/specify-how-traffic-data-is-used-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-how-traffic-data-is-used-route-request.md).
    *Trigger Condition*: Use when the user wants routes or travel times that
    account for live or historical traffic conditions. *Evidence Checkpoint*:
    Route request sets routing preferences or drivingOptions with departureTime
    and returns traffic-adjusted durations.
-   [ ] **Configures route modifiers to avoid tolls, highways, ferries, or
    indoor steps.** Read
    [references/specify-features-avoid-such-as-highways-or-tolls-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-features-avoid-such-as-highways-or-tolls-route-request.md).
    *Trigger Condition*: Use when the user wants a route that avoids toll roads,
    highways, or ferries. *Evidence Checkpoint*: Route request sets avoidance
    flags and returns a route bypassing the restricted features.
-   [ ] **Requests alternative routes or optimizes for shorter travel distance
    in a route request.** Read
    [references/specify-shorter-distance-or-alternative-routing-routes-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-shorter-distance-or-alternative-routing-routes-request.md).
    *Trigger Condition*: Use when the user wants multiple alternative routes or
    prefers a shorter-distance route. *Evidence Checkpoint*: Route request
    enables alternative routes and the response contains multiple route options.
-   [ ] **Calculates travel distances for a matrix of multiple origins and
    multiple destinations.** Read
    [references/return-distances-matrix-routes-between-multiple-origins-and-destinations.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-distances-matrix-routes-between-multiple-origins-and-destinations.md).
    *Trigger Condition*: Use when the user needs distances between many
    origin-destination pairs simultaneously. *Evidence Checkpoint*: Distance
    matrix response returns distance values for each origin-destination pair.
-   [ ] **Calculates travel durations for a matrix of multiple origins and
    multiple destinations.** Read
    [references/return-travel-times-matrix-routes-between-multiple-origins-and-destinations.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-travel-times-matrix-routes-between-multiple-origins-and-destinations.md).
    *Trigger Condition*: Use when the user needs travel times between multiple
    origins and destinations. *Evidence Checkpoint*: Distance matrix response
    returns duration values for each origin-destination element.
-   [ ] **Specifies the travel mode (driving, walking, bicycling, or transit)
    when computing a route matrix.** Read
    [references/specify-travel-mode-drive-transit-walk-two-wheeled-route-matrix-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-travel-mode-drive-transit-walk-two-wheeled-route-matrix-request.md).
    *Dependencies*:
    `["references/return-distances-matrix-routes-between-multiple-origins-and-destinations.md"]` \
    *Trigger Condition*: Use when the user wants a distance/duration matrix
    calculated for a specific mode of transport. *Evidence Checkpoint*: Matrix
    request specifies the travelMode and returns matrix elements for that mode.
-   [ ] **Visualizes real-time locations of Fleet Engine delivery vehicles and
    tasks on a map using the Journey Sharing library.** Read
    [references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md).
    *Dependencies*:
    `["references/add-customizable-interactive-map-web-page-or-mobile-app.md"]` \
    *Trigger Condition*: Use when the user wants to track Fleet Engine delivery
    vehicles or tasks in real time on a map. *Evidence Checkpoint*:
    JourneySharingMapView and FleetEngineLocationProvider render live vehicle
    and task locations on the map.
-   [ ] **Displays the active and predicted routes of Fleet Engine delivery
    vehicles on a fleet tracking map.** Read
    [references/add-predicted-routes-fleet-engine-delivery-vehicles-and-tasks-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-predicted-routes-fleet-engine-delivery-vehicles-and-tasks-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md"]` \
    *Trigger Condition*: Use when the user wants to show predicted delivery
    routes for Fleet Engine vehicles. *Evidence Checkpoint*: Fleet tracking map
    displays route polylines for the tracked delivery vehicle.
-   [ ] **Renders markers for a Fleet Engine delivery vehicle, its scheduled
    stops, delivery tasks, and waypoints on a map.** Read
    [references/add-fleet-engine-delivery-vehicles-location-stops-tasks-and-waypoint-markers-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-fleet-engine-delivery-vehicles-location-stops-tasks-and-waypoint-markers-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md"]` \
    *Trigger Condition*: Use when the user wants to display vehicle stops,
    tasks, and waypoint markers from Fleet Engine. *Evidence Checkpoint*:
    Vehicle, stop, and task markers are rendered on the JourneySharingMapView.
-   [ ] **Listens and responds to Fleet Engine location provider updates,
    errors, and delivery vehicle state changes.** Read
    [references/respond-fleet-engine-delivery-vehicle-events-including-completed-trips-segments-deliveries-and-tasks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-fleet-engine-delivery-vehicle-events-including-completed-trips-segments-deliveries-and-tasks.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md"]` \
    *Trigger Condition*: Use when the user wants to handle events from Fleet
    Engine vehicle, trip, or task updates. *Evidence Checkpoint*: Event
    listeners on the Fleet Engine location provider fire when vehicle or task
    data updates.
-   [ ] **Customizes the styling of roads, polylines, and polygons on a Fleet
    Engine Journey Sharing map.** Read
    [references/change-style-roads-polylines-and-polygons-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-roads-polylines-and-polygons-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/change-style-roads-polylines-and-polygons-map.md"]` \
    *Trigger Condition*: Use when the user wants to style base map roads and
    polygons on a Fleet Engine tracking map. *Evidence Checkpoint*: Base map
    associated with JourneySharingMapView applies custom road and polygon
    styles.
-   [ ] **Controls the visibility of base map features on a Fleet Engine fleet
    tracking map.** Read
    [references/display-or-hide-map-features-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/display-or-hide-map-features-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/display-or-hide-map-features.md"]` \
    *Trigger Condition*: Use when the user wants to show or hide map features on
    a Fleet Engine tracking map. *Evidence Checkpoint*: Feature visibility rules
    are applied to the underlying map of the JourneySharingMapView.
-   [ ] **Customizes the appearance of icons and text labels on a Fleet Engine
    fleet tracking map.** Read
    [references/change-style-icons-and-text-labels-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-icons-and-text-labels-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/change-style-icons-and-text-labels-map.md"]` \
    *Trigger Condition*: Use when the user wants to style map labels and icons
    on a Fleet Engine tracking map. *Evidence Checkpoint*: Label and icon
    styling rules are applied to the Fleet Engine tracking map instance.
-   [ ] **Applies zoom-dependent cloud map styling to a Fleet Engine fleet
    tracking map.** Read
    [references/apply-different-map-styles-different-zoom-levels-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-different-map-styles-different-zoom-levels-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/apply-different-map-styles-different-zoom-levels.md"]` \
    *Trigger Condition*: Use when the user wants different map styles at
    different zoom levels on a Fleet Engine map. *Evidence Checkpoint*: Cloud
    Map ID with zoom-level styling is configured on the Fleet Engine map view.
-   [ ] **Controls the density of points of interest displayed on a Fleet Engine
    fleet tracking map.** Read
    [references/change-density-places-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-density-places-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/change-density-places-map.md"]` \
    *Trigger Condition*: Use when the user wants to adjust POI density on a
    Fleet Engine tracking map. *Evidence Checkpoint*: POI density configuration
    is applied to the Fleet Engine map style.
-   [ ] **Customizes building footprint and extrusion styles on a Fleet Engine
    fleet tracking map.** Read
    [references/change-style-buildings-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-buildings-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/change-style-buildings-map.md"]` \
    *Trigger Condition*: Use when the user wants to style buildings on a Fleet
    Engine tracking map. *Evidence Checkpoint*: Building style configurations
    are applied to the Fleet Engine map view.
-   [ ] **Customizes the styling of landmarks on a Fleet Engine fleet tracking
    map.** Read
    [references/change-style-landmarks-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-style-landmarks-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/change-style-landmarks-map.md"]` \
    *Trigger Condition*: Use when the user wants to change the appearance of
    landmarks on a Fleet Engine tracking map. *Evidence Checkpoint*: Landmark
    styling rules are applied to the Fleet Engine map view.
-   [ ] **Customizes the icons and properties of vehicle, destination, and task
    markers on a Fleet Engine tracking map.** Read
    [references/customize-marker-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md"]` \
    *Trigger Condition*: Use when the user wants to customize vehicle or stop
    markers in Fleet Engine Journey Sharing. *Evidence Checkpoint*: Marker
    customization functions or options are passed to the Fleet Engine location
    provider or map view.
-   [ ] **Customizes the color, weight, and visibility of active and remaining
    route polylines on a Fleet Engine tracking map.** Read
    [references/customize-route-polyline-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-route-polyline-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["references/add-real-time-location-fleet-engine-delivery-vehicles-and-tasks-map.md",
    "references/add-predicted-routes-fleet-engine-delivery-vehicles-and-tasks-map.md"]` \
    *Trigger Condition*: Use when the user wants to style the vehicle route
    polyline in Fleet Engine Journey Sharing. *Evidence Checkpoint*: Polyline
    customization options are applied to the Fleet Engine location provider.

### Phase 3: Operational Constraints & Guardrails (Constraint)

-   [ ] **Step 3.1: Defines the required fields array (field mask) for Place
    Details, Text Search, and Nearby Search requests to control data returned
    and billing SKUs.** Read
    [references/specify-data-fields-included-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-data-fields-included-place-information-responses.md).
    *Trigger Condition*: Use whenever making a Place.fetchFields,
    Place.searchByText, or Place.searchNearby call. *Evidence Checkpoint*: The
    fields array is explicitly specified in the request options with valid
    camelCase Place field names.
