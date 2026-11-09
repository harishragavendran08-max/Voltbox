package com.voltbox.model;

/**
 * Persistent model representing a single user search query event captured by
 * {@link com.voltbox.controller.ProductController} and analyzed by
 * {@link com.voltbox.service.SearchAnalyticsService}.
 */
public class SearchQueryLog {
    public int id;
    public String rawQuery;
    public String normalizedQuery;
    public String categoryFilter = "all";
    public int resultCount;
    public boolean zeroResultGap;
    public String inferredComponentGroup = "other";
    public String source = "searchbar";
    public String actorName = "Guest Shopper";
    public long timestamp;

    public SearchQueryLog() {
    }

    public SearchQueryLog(
            int id,
            String rawQuery,
            String normalizedQuery,
            String categoryFilter,
            int resultCount,
            boolean zeroResultGap,
            String inferredComponentGroup,
            String source,
            String actorName,
            long timestamp) {
        this.id = id;
        this.rawQuery = rawQuery;
        this.normalizedQuery = normalizedQuery;
        this.categoryFilter = categoryFilter != null && !categoryFilter.isBlank() ? categoryFilter : "all";
        this.resultCount = Math.max(0, resultCount);
        this.zeroResultGap = zeroResultGap;
        this.inferredComponentGroup = inferredComponentGroup != null && !inferredComponentGroup.isBlank()
                ? inferredComponentGroup
                : "other";
        this.source = source != null && !source.isBlank() ? source : "searchbar";
        this.actorName = actorName != null && !actorName.isBlank() ? actorName : "Guest Shopper";
        this.timestamp = timestamp > 0 ? timestamp : System.currentTimeMillis();
    }
}
