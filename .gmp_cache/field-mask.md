# Specify the data fields included in place information responses.

When requesting place information using the Maps JavaScript API `Place`
class—whether fetching details for a specific place, performing a Text Search,
or executing a Nearby Search—you must explicitly specify which data fields to
return in the `fields` array.

## Overview & Billing Impact

Place data fields correspond to Place Details results and are divided into
different pricing tiers/SKUs:

-   **IDs Only / Essentials (IDs Only)**: Lowest cost (e.g., `id`, `name`,
    `photos` for Place Details).
-   **Essentials**: Basic address and location data (e.g., `addressComponents`,
    `formattedAddress`, `location`, `viewport`, `types`, `plusCode`).
-   **Pro**: Extended basic information (e.g., `displayName`, `businessStatus`,
    `primaryType`, `accessibilityOptions`, `svgIconMaskURI`,
    `iconBackgroundColor`, `utcOffsetMinutes`, `timeZone`).
-   **Enterprise**: Contact information, hours, and ratings (e.g.,
    `nationalPhoneNumber`, `internationalPhoneNumber`, `openingHours`, `rating`,
    `userRatingCount`, `websiteURI`, `priceLevel`).
-   **Enterprise + Atmosphere**: Rich content, reviews, AI-powered summaries,
    and amenities (e.g., `reviews`, `editorialSummary`, `generativeSummary`,
    `reviewSummary`, `evChargeOptions`, `fuelOptions`, `parkingOptions`,
    `paymentOptions`, and service booleans like `hasDelivery`, `servesCoffee`,
    `allowsDogs`).

> **Note on Attributions**: Every call always returns an `Attribution`
> (`place.attributions`) for each result, which **must** be shown in your UI
> whenever present, in accordance with Google Maps Platform Terms of Service.
> Furthermore, photos and reviews contain their own `authorAttributions`
> (`photo.authorAttributions`, `review.authorAttribution`) that must also be
> displayed alongside the respective content.

--------------------------------------------------------------------------------

## Implementation Patterns

### 1. Specifying Fields in Place Details (`place.fetchFields`)

When you have a `Place` instance (created from a Place ID or obtained from an
Autocomplete prediction), pass the `fields` array to `place.fetchFields()`.

```typescript
async function getPlaceDetails() {
  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
  const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

  const map = new Map(document.getElementById("map") as HTMLElement, {
    center: { lat: 37.4161493, lng: -122.0812166 },
    zoom: 14,
    mapId: "DEMO_MAP_ID",
    internalUsageAttributionIds: ["gmp_git_agentskills_v1"],
  });

  // Create a new Place instance using a Place ID
  const place = new Place({
    id: "ChIJN5Nz71W3j4ARhx5bwpTQEGg",
    requestedLanguage: "en",
  });

  // Specify only the data fields needed by your application
  await place.fetchFields({
    fields: ["displayName", "formattedAddress", "location", "rating", "websiteURI"],
  });

  console.log(`${place.displayName}: ${place.formattedAddress}`);

  if (place.location) {
    new AdvancedMarkerElement({
      map,
      position: place.location,
      title: place.displayName,
    });
  }
}
```

*Source:
[samples/place-class/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-class/index.ts?utm_campaign=gmp_git_agentskills_v1)*

### 2. Specifying Fields in Text Search (`Place.searchByText`)

When searching for places by a text query, include the `fields` property in the
request object passed to `Place.searchByText()`.

```typescript
async function findPlacesByText() {
  const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

  const request = {
    textQuery: "Tacos in Mountain View",
    // Specify required fields to populate on each returned Place object
    fields: ["displayName", "location", "businessStatus", "priceLevel"],
    includedType: "restaurant",
    locationBias: { lat: 37.4161493, lng: -122.0812166 },
    isOpenNow: true,
    maxResultCount: 8,
    internalUsageAttributionIds: ["gmp_git_agentskills_v1"],
  };

  const { places } = await Place.searchByText(request);

  places.forEach((place) => {
    console.log(place.displayName, place.businessStatus, place.priceLevel);
  });
}
```

*Source:
[samples/place-text-search/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-text-search/index.ts?utm_campaign=gmp_git_agentskills_v1)*

### 3. Specifying Fields in Nearby Search (`Place.searchNearby`)

When searching for places within a geographic area, pass the `fields` array in
the `Place.searchNearby()` request object.

```typescript
async function findPlacesNearby() {
  const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

  const request = {
    // Specify the fields to return
    fields: ["displayName", "location", "businessStatus", "openingHours"],
    locationRestriction: {
      center: { lat: 52.369358, lng: 4.889258 },
      radius: 500,
    },
    includedPrimaryTypes: ["restaurant"],
    maxResultCount: 5,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
    internalUsageAttributionIds: ["gmp_git_agentskills_v1"],
  };

  const { places } = await Place.searchNearby(request);

  places.forEach((place) => {
    console.log(place.displayName, place.location);
  });
}
```

*Source:
[samples/place-nearby-search/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-nearby-search/index.ts?utm_campaign=gmp_git_agentskills_v1)*

### 4. Handling Rich Media Fields (`photos` and `reviews`)

When requesting `photos` or `reviews`, always check for their existence and
render their required author attributions.

```typescript
async function fetchPhotosAndReviews() {
  const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

  const place = new Place({
    id: "ChIJydSuSkkUkFQRsqhB-cEtYnw",
  });

  await place.fetchFields({
    fields: ["displayName", "photos", "reviews", "editorialSummary"],
  });

  // Handle Photos and Author Attributions
  if (place.photos && place.photos.length > 0) {
    const firstPhoto = place.photos[0];
    const photoUri = firstPhoto.getURI({ maxHeight: 380 });
    const attributions = firstPhoto.authorAttributions; // Array of AuthorAttribution
    console.log("Photo URI:", photoUri, "Attributions:", attributions);
  }

  // Handle Reviews and Author Attributions
  if (place.reviews && place.reviews.length > 0) {
    const firstReview = place.reviews[0];
    console.log("Review Rating:", firstReview.rating);
    console.log("Review Text:", firstReview.text);
    if (firstReview.authorAttribution) {
      console.log("Author:", firstReview.authorAttribution.displayName, firstReview.authorAttribution.uri);
    }
  }
}
```

*Sources:
[samples/place-photos/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-photos/index.ts?utm_campaign=gmp_git_agentskills_v1),
[samples/place-reviews/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-reviews/index.ts?utm_campaign=gmp_git_agentskills_v1)*

--------------------------------------------------------------------------------

## Supported Place Data Fields Reference

The following table lists all property field names supported by the `Place`
class and their corresponding billing SKUs across Place Details, Text Search,
and Nearby Search:

Field Description                       | Property Field (`fields` value)      | Place Details SKU       | Text Search SKU         | Nearby Search SKU
:-------------------------------------- | :----------------------------------- | :---------------------- | :---------------------- | :----------------
**Identification & Naming**             |                                      |                         |                         |
Place ID                                | `id`                                 | Essentials (IDs Only)   | Essentials (IDs only)   | Pro
Name (Resource Name)                    | `name`                               | Essentials (IDs Only)   | Essentials (IDs Only)   | Pro
Display Name                            | `displayName`                        | Pro                     | Pro                     | Pro
Display Name Language Code              | `displayNameLanguageCode`            | Pro                     | Pro                     | Pro
**Location & Address**                  |                                      |                         |                         |
Address Components                      | `addressComponents`                  | Essentials              | Pro                     | Pro
Address Descriptor                      | `addressDescriptor`                  | Essentials              | Pro                     | Pro
Formatted Address (ADR)                 | `adrFormatAddress`                   | Essentials              | Pro                     | Pro
Formatted Address                       | `formattedAddress`                   | Essentials              | Pro                     | Pro
Location                                | `location`                           | Essentials              | Pro                     | Pro
Plus Code                               | `plusCode`                           | Essentials              | Pro                     | Pro
Viewport                                | `viewport`                           | Essentials              | Pro                     | Pro
Containing Places                       | `containingPlaces`                   | Pro                     | Pro                     | Pro
Time Zone                               | `timeZone`                           | Pro                     | Pro                     | Pro
UTC Offset                              | `utcOffsetMinutes`                   | Pro                     | Pro                     | Pro
**Classification & Visuals**            |                                      |                         |                         |
Types                                   | `types`                              | Essentials              | Pro                     | Pro
Primary Type                            | `primaryType`                        | Pro                     | Pro                     | Pro
Primary Type Display Name               | `primaryTypeDisplayName`             | Pro                     | Pro                     | Pro
Primary Type Display Name Language Code | `primaryTypeDisplayNameLanguageCode` | Pro                     | Pro                     | Pro
Business Status                         | `businessStatus`                     | Pro                     | Pro                     | Pro
Icon Mask Base URI                      | `svgIconMaskURI`                     | Pro                     | Pro                     | Pro
Icon Background Color                   | `iconBackgroundColor`                | Pro                     | Pro                     | Pro
Photo                                   | `photos`                             | Essentials (IDs Only)   | Pro                     | Pro
**Contact, Hours & Ratings**            |                                      |                         |                         |
Phone Number (National)                 | `nationalPhoneNumber`                | Enterprise              | Enterprise              | Enterprise
International Phone Number              | `internationalPhoneNumber`           | Enterprise              | Enterprise              | Enterprise
Opening Hours                           | `openingHours`                       | Enterprise              | Pro                     | Enterprise
Website / URL                           | `websiteURI`                         | Enterprise              | Enterprise              | Enterprise
Price Level                             | `priceLevel`                         | Enterprise              | Enterprise              | Enterprise
Rating                                  | `rating`                             | Enterprise              | Enterprise              | Enterprise
Ratings Count                           | `userRatingCount`                    | Enterprise              | Enterprise              | Enterprise
Transit Station                         | `transitStation`                     | Enterprise              | Enterprise              | Enterprise
**Reviews & Summaries**                 |                                      |                         |                         |
Editorial Summary                       | `editorialSummary`                   | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Reviews                                 | `reviews`                            | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
AI-powered Place Summary                | `generativeSummary`                  | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
AI-powered Review Summary               | `reviewSummary`                      | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
AI-powered Neighborhood Summary         | `neighborhoodSummary`                | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
AI-powered EVCS Amenity Summary         | `evChargeAmenitySummary`             | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
**Facilities, Services & Atmosphere**   |                                      |                         |                         |
Accessibility Options                   | `accessibilityOptions`               | Pro                     | Pro                     | Pro
Allows Dogs                             | `allowsDogs`                         | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Curbside Pickup                         | `hasCurbsidePickup`                  | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Delivery                                | `hasDelivery`                        | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Dine-in                                 | `hasDineIn`                          | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
EV Charge Options                       | `evChargeOptions`                    | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Fuel Options                            | `fuelOptions`                        | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Good For Children                       | `isGoodForChildren`                  | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Good For Groups                         | `isGoodForGroups`                    | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Good For Watching Sports                | `isGoodForWatchingSports`            | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Live Music                              | `hasLiveMusic`                       | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Menu For Children                       | `hasMenuForChildren`                 | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Outdoor Seating                         | `hasOutdoorSeating`                  | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Parking Options                         | `parkingOptions`                     | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Payment Options                         | `paymentOptions`                     | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Reservable                              | `isReservable`                       | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Restroom                                | `hasRestroom`                        | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Beer                             | `servesBeer`                         | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Breakfast                        | `servesBreakfast`                    | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Brunch                           | `servesBrunch`                       | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Cocktails                        | `servesCocktails`                    | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Coffee                           | `servesCoffee`                       | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Dessert                          | `servesDessert`                      | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Dinner                           | `servesDinner`                       | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Lunch                            | `servesLunch`                        | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Vegetarian Food                  | `servesVegetarianFood`               | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Serves Wine                             | `servesWine`                         | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
Takeout                                 | `hasTakeout`                         | Enterprise + Atmosphere | Enterprise + Atmosphere | Enterprise + Atmosphere
