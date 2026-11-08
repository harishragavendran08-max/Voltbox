---
name: places-api-web-api
description: Use this skill when the user wants to search for places, retrieve place details, fetch place photos, get autocomplete suggestions, generate Google Maps action URIs, calculate routing distances and travel times to search results, or retrieve AI-powered place, review, and area summaries using the Google Maps Platform Places API (Web API / REST).
license: Apache-2.0
metadata:
  version: 1.0.57
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

### Overview

Use this skill to interact with the Google Maps Platform Places API via HTTP
REST requests. This skill enables applications to discover places using text
queries, nearby location searches, or searches along a predefined route, as well
as provide real-time place autocomplete predictions.

Beyond basic discovery, this skill supports retrieving rich place details, user
ratings, reviews, and adjustable place photos while optimizing response payloads
through field masks and place type filtering. It also covers generating direct
Google Maps URIs (for details, directions, reviews, and photos), computing
routing summaries (distance and travel time from origins or along routes), and
fetching AI-powered summaries for places, user reviews, surrounding areas, and
EV charging station amenities.

## Primary Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced capability sub-workflow file and
satisfy its *Evidence Checkpoint* before advancing.

### Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### Feature Module: Places (Optional - Use-Case Dependent)

-   [ ] **Returns a list of places and place details based on a text query
    string using Text Search.** Read
    [references/return-list-places-and-place-details-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-list-places-and-place-details-based-query-string.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to search for places using a
    text query string. *Evidence Checkpoint*: The HTTP POST request to the
    places:searchText endpoint returns a 200 OK status with a JSON payload
    containing a list of matching places.
-   [ ] **Returns a list of places and place details near a specific geographic
    location using Nearby Search.** Read
    [references/return-list-places-and-place-details-near-specific-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-list-places-and-place-details-near-specific-location.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to search for places within a
    specified geographic area or radius around a coordinate. *Evidence
    Checkpoint*: The HTTP POST request to the places:searchNearby endpoint
    returns a 200 OK status with a JSON payload containing places within the
    specified location restriction.
-   [ ] **Returns place predictions and query autocomplete results based on a
    partial text query string.** Read
    [references/return-autocomplete-results-about-places-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-autocomplete-results-about-places-based-query-string.md).
    *Trigger Condition*: Use when the user wants to implement type-ahead
    autocomplete suggestions for places or search queries. *Evidence
    Checkpoint*: The HTTP POST request to the places:autocomplete endpoint
    returns a 200 OK status with a JSON payload containing place or query
    suggestions.
-   [ ] **Returns comprehensive detailed information about a specific place
    using its Place ID.** Read
    [references/return-detailed-information-about-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-detailed-information-about-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to retrieve details about a
    specific place using a Place ID. *Evidence Checkpoint*: The HTTP GET request
    to the places/{placeId} endpoint returns a 200 OK status with a JSON payload
    containing the requested place fields.
-   [ ] **Retrieves photo references and renders photos associated with a
    specific place.** Read
    [references/return-photos-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-photos-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to fetch or display photos for
    a place. *Evidence Checkpoint*: The HTTP GET request to the place photo
    media endpoint returns the image binary or a redirect URI to the photo.
-   [ ] **Resizes place photos by specifying maximum height or width dimensions
    in the photo media request.** Read
    [references/resize-place-photos.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/resize-place-photos.md).
    *Dependencies*: `["references/return-photos-specific-place.md"]` \
    *Trigger Condition*: Use when the user wants to control the dimensions or
    resolution of returned place photos. *Evidence Checkpoint*: The HTTP GET
    request to the photo media endpoint includes valid maxHeightPx or maxWidthPx
    parameters and returns a resized image.
-   [ ] **Retrieves user ratings, total rating count, and individual reviews for
    a specific place.** Read
    [references/return-ratings-and-reviews-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-ratings-and-reviews-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to get ratings or customer
    reviews for a place. *Evidence Checkpoint*: The HTTP response JSON payload
    includes the rating, userRatingCount, or reviews fields for the requested
    place.
-   [ ] **Returns a direct URI to open the place details page in Google Maps.**
    Read
    [references/return-uri-open-place-details-page-google-maps-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-uri-open-place-details-page-google-maps-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a link to view a specific place
    on Google Maps. *Evidence Checkpoint*: The HTTP response JSON includes the
    googleMapsUri or googleMapsLinks.placeUri field.
-   [ ] **Returns a direct URI to open the directions page in Google Maps for a
    specific place.** Read
    [references/return-uri-open-directions-page-google-maps-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-uri-open-directions-page-google-maps-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a link to launch Google Maps
    directions to a place. *Evidence Checkpoint*: The HTTP response JSON
    includes the googleMapsLinks.directionsUri field.
-   [ ] **Returns a direct URI to open the write a review page in Google Maps
    for a specific place.** Read
    [references/return-uri-open-write-review-page-google-maps-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-uri-open-write-review-page-google-maps-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a link allowing end-users to
    write a Google Maps review for a place. *Evidence Checkpoint*: The HTTP
    response JSON includes the googleMapsLinks.writeAReviewUri field.
-   [ ] **Returns a direct URI to open the read reviews page in Google Maps for
    a specific place.** Read
    [references/return-uri-open-read-reviews-page-google-maps-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-uri-open-read-reviews-page-google-maps-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a link to view all reviews for
    a place directly on Google Maps. *Evidence Checkpoint*: The HTTP response
    JSON includes the googleMapsLinks.reviewsUri field.
-   [ ] **Returns a direct URI to open the photos page in Google Maps for a
    specific place.** Read
    [references/return-uri-open-photos-page-google-maps-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-uri-open-photos-page-google-maps-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a link to view the photo
    gallery for a place on Google Maps. *Evidence Checkpoint*: The HTTP response
    JSON includes the googleMapsLinks.photosUri field.
-   [ ] **Returns an AI-powered generative overview summary for a specific
    place.** Read
    [references/return-ai-powered-overview-summary-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-ai-powered-overview-summary-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants an AI-generated summary or
    overview description of a place. *Evidence Checkpoint*: The HTTP response
    JSON includes the generativeSummary field containing overview text.
-   [ ] **Returns an AI-powered area summary describing the neighborhood and
    places around a specific place.** Read
    [references/return-ai-powered-area-summary-describing-places-area-around-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-ai-powered-area-summary-describing-places-area-around-specific-place.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants an AI-generated summary of the
    area or vicinity surrounding a place. *Evidence Checkpoint*: The HTTP
    response JSON includes the areaSummary field describing the surrounding
    area.
-   [ ] **Returns places matching a text query string that are located along a
    predefined route polyline using Text Search.** Read
    [references/return-information-about-places-based-query-string-that-are-located-along-predefined-route.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-information-about-places-based-query-string-that-are-located-along-predefined-route.md).
    *Dependencies*:
    `["references/return-list-places-and-place-details-based-query-string.md",
    "references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants to search for places along a
    specific route polyline. *Evidence Checkpoint*: The HTTP POST request to
    places:searchText includes searchAlongRouteParameters with an encoded
    polyline and returns matching places.
-   [ ] **Returns distance, travel time, and directions URI between specified
    origin coordinates and each place returned by a Text Search or Nearby
    Search.** Read
    [references/return-distance-travel-time-and-directions-uri-between-set-latitudelongitude-coordinates-and-each-pl.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-distance-travel-time-and-directions-uri-between-set-latitudelongitude-coordinates-and-each-pl.md).
    *Dependencies*:
    `["references/return-list-places-and-place-details-based-query-string.md",
    "references/return-list-places-and-place-details-near-specific-location.md",
    "references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants routing summaries (distance,
    duration, and directions links) from a starting location to each place in
    search results. *Evidence Checkpoint*: The HTTP POST request includes
    routingParameters.origin, and the response JSON includes routingSummaries
    with legs containing duration and distanceMeters.
-   [ ] **Returns distance, travel time, and directions URI from a predefined
    route's origin to each place found along that route.** Read
    [references/return-distance-travel-time-and-directions-uri-between-origin-predefined-route-and-each-places-retur.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-distance-travel-time-and-directions-uri-between-origin-predefined-route-and-each-places-retur.md).
    *Dependencies*:
    `["references/return-information-about-places-based-query-string-that-are-located-along-predefined-route.md",
    "references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when searching along a route and the user wants
    travel time and distance from the route's origin to each candidate stop.
    *Evidence Checkpoint*: The HTTP POST request includes
    searchAlongRouteParameters and routingParameters, and the response JSON
    includes routingSummaries.
-   [ ] **Returns distance, travel time, and directions URI from each place
    found along a predefined route to the route's final destination.** Read
    [references/return-distance-travel-time-and-directions-uri-between-each-places-returned-based-query-string-that.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-distance-travel-time-and-directions-uri-between-each-places-returned-based-query-string-that.md).
    *Dependencies*:
    `["references/return-information-about-places-based-query-string-that-are-located-along-predefined-route.md",
    "references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when searching along a route and the user wants
    two-leg routing summaries (origin to place, and place to final destination).
    *Evidence Checkpoint*: The HTTP response JSON includes routingSummaries
    containing two legs representing the trip from origin to the place and from
    the place to the route destination.
-   [ ] **Returns an AI-powered summary of user reviews for a specified Place
    ID.** Read
    [references/return-ai-powered-summary-user-reviews-specified-google-place-identifier.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-ai-powered-summary-user-reviews-specified-google-place-identifier.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants a synthesized AI summary of
    customer reviews for a place. *Evidence Checkpoint*: The HTTP response JSON
    includes the reviewSummary field for the specified place.
-   [ ] **Returns an AI-powered neighborhood and amenities summary surrounding a
    specified electric vehicle (EV) charging station Place ID.** Read
    [references/return-ai-powered-place-summary-area-and-amenities-surrounding-specified-google-place-identifier-ele.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/return-ai-powered-place-summary-area-and-amenities-surrounding-specified-google-place-identifier-ele.md).
    *Dependencies*:
    `["references/specify-data-fields-included-place-information-responses.md"]` \
    *Trigger Condition*: Use when the user wants an AI-generated summary of
    nearby amenities and places around an EV charging station. *Evidence
    Checkpoint*: The HTTP response JSON includes the neighborhoodSummary or
    EV-specific area summary fields for the specified place.

### Phase 2: Operational Constraints & Guardrails (Constraint)

-   [ ] **Step 2.1: Specifies the field mask (X-Goog-FieldMask) to control which
    data fields are returned in Place Details, Text Search, and Nearby Search
    responses.** Read
    [references/specify-data-fields-included-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/specify-data-fields-included-place-information-responses.md).
    *Trigger Condition*: Use whenever making requests to Place Details, Text
    Search, or Nearby Search to specify required response fields and manage API
    costs. *Evidence Checkpoint*: The HTTP request includes a valid
    X-Goog-FieldMask header or fields parameter, and the response contains only
    the specified fields.
-   [ ] **Step 2.2: Filters or restricts place search and autocomplete results
    to specific place types (e.g., restaurant, cafe, hotel).** Read
    [references/specify-place-types-include-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/places-api-web-api/references/specify-place-types-include-place-information-responses.md).
    *Trigger Condition*: Use when the user wants to filter search or
    autocomplete results by specific place categories or types. *Evidence
    Checkpoint*: The HTTP request body includes valid includedTypes,
    excludedTypes, or includedPrimaryTypes parameters, and the response only
    returns matching places.
