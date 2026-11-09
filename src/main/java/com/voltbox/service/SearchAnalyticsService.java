package com.voltbox.service;

import com.voltbox.Store;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.SearchQueryLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Server-side Java service for logging user search queries from {@link com.voltbox.controller.ProductController},
 * normalizing hardware search terms, inferring component categories, and aggregating popular searches
 * and zero-result catalog gaps for the {@code /admin} dashboard.
 */
@Service
public class SearchAnalyticsService {
    private static final Logger log = LoggerFactory.getLogger(SearchAnalyticsService.class);
    public static final int MAX_STORED_SEARCH_LOGS = 500;

    private final Store store;
    private final ProductService productService;

    @Autowired
    public SearchAnalyticsService(Store store, ProductService productService) {
        this.store = store;
        this.productService = productService;
        ensureSeededSearchLogs();
    }

    /**
     * Normalizes a raw user search query by trimming, collapsing internal whitespace,
     * and converting to lowercase for canonical grouping.
     */
    public static String normalizeQuery(String rawQuery) {
        if (rawQuery == null) return "";
        String cleaned = rawQuery.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        if (cleaned.length() > 80) {
            cleaned = cleaned.substring(0, 80).trim();
        }
        return cleaned;
    }

    /**
     * Infers the target hardware component group from a normalized search query and optional category filter.
     */
    public static String inferComponentGroup(String normalizedQuery, String categoryFilter) {
        if (categoryFilter != null && !categoryFilter.isBlank() && !"all".equalsIgnoreCase(categoryFilter)
                && !"low-stock".equalsIgnoreCase(categoryFilter) && !"wishlist".equalsIgnoreCase(categoryFilter)) {
            return ProductService.resolveComponentGroup(categoryFilter, normalizedQuery);
        }
        String q = normalizedQuery != null ? normalizedQuery.toLowerCase(Locale.ROOT) : "";
        if (q.contains("rtx") || q.contains("gtx") || q.contains("radeon") || q.contains("rx ")
                || q.contains("gpu") || q.contains("graphics") || q.contains("geforce") || q.contains("vram")) {
            return "gpus";
        }
        if (q.contains("ryzen") || q.contains("intel") || q.contains("core i") || q.contains("threadripper")
                || q.contains("cpu") || q.contains("processor") || q.contains("cooler") || q.contains("aio")
                || q.contains("kraken") || q.contains("noctua")) {
            return "cpus";
        }
        if (q.contains("motherboard") || q.contains("b650") || q.contains("x870") || q.contains("z790")
                || q.contains("b550") || q.contains("b570") || q.contains("ddr5") || q.contains("ddr4")
                || q.contains("ram") || q.contains("vengeance") || q.contains("psu") || q.contains("power supply")
                || q.contains("chassis") || q.contains("case") || q.contains("lian li")) {
            return "motherboards";
        }
        if (q.contains("ssd") || q.contains("nvme") || q.contains("hdd") || q.contains("harddisk")
                || q.contains("storage") || q.contains("m.2") || q.contains("gen5") || q.contains("wd_black")
                || q.contains("990 pro") || q.contains("sdcard")) {
            return "storage";
        }
        if (q.contains("airpods") || q.contains("headset") || q.contains("headphones") || q.contains("dac")
                || q.contains("microphone") || q.contains("audio") || q.contains("speaker") || q.contains("earbuds")
                || q.contains("arctis") || q.contains("sony wh")) {
            return "audio";
        }
        if (q.contains("ps5") || q.contains("playstation") || q.contains("xbox") || q.contains("nintendo")
                || q.contains("switch") || q.contains("steam deck") || q.contains("controller") || q.contains("keyboard")
                || q.contains("mouse") || q.contains("monitor") || q.contains("oled") || q.contains("gaming")) {
            return "gaming";
        }
        return "other";
    }

    public static String recommendedSkuPrefixForGroup(String group) {
        if (group == null) return "VB-PRT";
        switch (group.toLowerCase(Locale.ROOT)) {
            case "gpus": return "VB-GPU";
            case "cpus": return "VB-CPU";
            case "motherboards": return "VB-MBD";
            case "storage": return "VB-STR";
            case "audio": return "VB-AUD";
            case "gaming": return "VB-GMG";
            default: return "VB-PRT";
        }
    }

    /**
     * Records a user search event in the persistent store and emits a structured server-side log entry.
     */
    public synchronized SearchQueryLog recordSearchQuery(
            String rawQuery,
            String categoryFilter,
            Integer explicitResultCount,
            String source,
            String actorName) {
        String normalized = normalizeQuery(rawQuery);
        if (normalized.length() < 2) {
            return null;
        }

        String cat = (categoryFilter != null && !categoryFilter.isBlank()) ? categoryFilter.trim().toLowerCase(Locale.ROOT) : "all";
        int resultCount;
        if (explicitResultCount != null && explicitResultCount >= 0) {
            resultCount = explicitResultCount;
        } else {
            List<ProductEntity> matches = productService.listActiveProducts(
                    "all".equals(cat) ? null : cat,
                    null,
                    normalized,
                    null
            );
            resultCount = matches.size();
        }

        boolean isGap = resultCount == 0;
        String inferredGroup = inferComponentGroup(normalized, cat);
        String resolvedSource = (source != null && !source.isBlank()) ? source.trim().toLowerCase(Locale.ROOT) : "searchbar";
        String resolvedActor = (actorName != null && !actorName.isBlank()) ? actorName.trim() : "Guest Shopper";

        SearchQueryLog entry = store.addSearchLog(
                rawQuery.trim(),
                normalized,
                cat,
                resultCount,
                isGap,
                inferredGroup,
                resolvedSource,
                resolvedActor
        );

        log.info("[VOLTBOX-SEARCH-LOG] id={} query=\"{}\" normalized=\"{}\" category=\"{}\" results={} catalogGap={} group=\"{}\" source=\"{}\" actor=\"{}\"",
                entry.id, entry.rawQuery, entry.normalizedQuery, entry.categoryFilter,
                entry.resultCount, entry.zeroResultGap, entry.inferredComponentGroup,
                entry.source, entry.actorName);

        return entry;
    }

    /**
     * Aggregates all recorded search queries into Popular Searches, Zero-Result Catalog Gaps,
     * and Category Demand Breakdown for the Admin Console.
     */
    public synchronized Map<String, Object> getSearchAnalyticsReport() {
        List<SearchQueryLog> logs = store.getSearchLogs();
        int totalSearches = logs.size();
        int zeroResultSearches = 0;
        long totalResultsAccum = 0L;

        Map<String, List<SearchQueryLog>> byNormalized = new LinkedHashMap<>();
        Map<String, Integer> groupDemand = new LinkedHashMap<>();
        for (String g : new String[]{"gpus", "cpus", "motherboards", "storage", "audio", "gaming", "other"}) {
            groupDemand.put(g, 0);
        }

        for (SearchQueryLog item : logs) {
            if (item == null || item.normalizedQuery == null || item.normalizedQuery.isBlank()) continue;
            if (item.zeroResultGap || item.resultCount == 0) {
                zeroResultSearches++;
            }
            totalResultsAccum += Math.max(0, item.resultCount);
            byNormalized.computeIfAbsent(item.normalizedQuery, k -> new ArrayList<>()).add(item);

            String grp = item.inferredComponentGroup != null ? item.inferredComponentGroup : "other";
            groupDemand.put(grp, groupDemand.getOrDefault(grp, 0) + 1);
        }

        List<Map<String, Object>> popularSearches = new ArrayList<>();
        List<Map<String, Object>> catalogGaps = new ArrayList<>();

        for (Map.Entry<String, List<SearchQueryLog>> entry : byNormalized.entrySet()) {
            String norm = entry.getKey();
            List<SearchQueryLog> occurrences = entry.getValue();
            int count = occurrences.size();
            SearchQueryLog latest = occurrences.get(0);
            for (SearchQueryLog occ : occurrences) {
                if (occ.timestamp >= latest.timestamp) {
                    latest = occ;
                }
            }
            double avgResults = occurrences.stream().mapToInt(o -> Math.max(0, o.resultCount)).average().orElse(0.0);
            int zeroCount = (int) occurrences.stream().filter(o -> o.zeroResultGap || o.resultCount == 0).count();
            boolean isCatalogGap = latest.resultCount == 0 || zeroCount * 2 >= count;
            String group = inferComponentGroup(norm, latest.categoryFilter);
            String skuPrefix = recommendedSkuPrefixForGroup(group);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("normalizedQuery", norm);
            row.put("displayQuery", latest.rawQuery != null && !latest.rawQuery.isBlank() ? latest.rawQuery : norm);
            row.put("searchCount", count);
            row.put("lastResultCount", latest.resultCount);
            row.put("avgResultCount", Math.round(avgResults * 10.0) / 10.0);
            row.put("zeroResultCount", zeroCount);
            row.put("isCatalogGap", isCatalogGap);
            row.put("inferredGroup", group);
            row.put("recommendedCategory", "other".equals(group) ? "components" : group);
            row.put("suggestedSkuPrefix", skuPrefix);
            row.put("lastSearchedAt", latest.timestamp);
            row.put("lastSource", latest.source);
            row.put("priorityLevel", isCatalogGap ? (count >= 4 ? "HIGH" : (count >= 2 ? "MEDIUM" : "LOW")) : "COVERED");
            row.put("opportunityNote", isCatalogGap
                    ? String.format("0 catalog matches across %d searches — recommended new %s SKU", count, skuPrefix)
                    : String.format("%d active SKU(s) matched", latest.resultCount));

            popularSearches.add(row);
            if (isCatalogGap) {
                catalogGaps.add(row);
            }
        }

        Comparator<Map<String, Object>> byVolumeDesc = (a, b) -> {
            int cmp = Integer.compare(((Number) b.get("searchCount")).intValue(), ((Number) a.get("searchCount")).intValue());
            if (cmp != 0) return cmp;
            return Long.compare(((Number) b.get("lastSearchedAt")).longValue(), ((Number) a.get("lastSearchedAt")).longValue());
        };
        popularSearches.sort(byVolumeDesc);
        catalogGaps.sort(byVolumeDesc);

        List<SearchQueryLog> recentLogs = logs.stream()
                .sorted((a, b) -> Long.compare(b.timestamp, a.timestamp))
                .limit(40)
                .collect(Collectors.toList());

        double gapRatePct = totalSearches > 0
                ? Math.round(((double) zeroResultSearches / totalSearches) * 1000.0) / 10.0
                : 0.0;
        double avgResultsPerSearch = totalSearches > 0
                ? Math.round(((double) totalResultsAccum / totalSearches) * 10.0) / 10.0
                : 0.0;

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("ok", true);
        report.put("totalSearches", totalSearches);
        report.put("uniqueQueries", byNormalized.size());
        report.put("zeroResultSearches", zeroResultSearches);
        report.put("catalogGapCount", catalogGaps.size());
        report.put("catalogGapRatePct", gapRatePct);
        report.put("avgResultsPerSearch", avgResultsPerSearch);
        report.put("popularSearches", popularSearches);
        report.put("catalogGaps", catalogGaps);
        report.put("groupDemand", groupDemand);
        report.put("recentLogs", recentLogs);
        return report;
    }

    private void ensureSeededSearchLogs() {
        if (!store.getSearchLogs().isEmpty()) {
            return;
        }
        long now = System.currentTimeMillis();
        Object[][] seeds = new Object[][]{
                // Popular matched searches
                {"Nvidia RTX 5090", "all", 1, "searchbar", "Alex Chen", now - 3600_000L * 5},
                {"rtx 5090", "gpus", 1, "searchbar", "Maya Lin", now - 3600_000L * 4},
                {"RTX 5090", "all", 1, "voice", "Guest Shopper", now - 3600_000L * 2},
                {"AMD Ryzen 9", "cpus", 2, "searchbar", "Alex Chen", now - 3600_000L * 6},
                {"ryzen 7 7800x3d", "all", 1, "searchbar", "Guest Shopper", now - 3600_000L * 3},
                {"Samsung SSD", "storage", 2, "searchbar", "Maya Lin", now - 3600_000L * 7},
                {"ps5 pro", "gaming", 1, "searchbar", "Guest Shopper", now - 3600_000L * 3},
                {"corsair ddr5", "motherboards", 1, "searchbar", "Harish", now - 3600_000L * 2},
                // Zero-result Catalog Gaps (high-signal missing SKUs for admin analysis)
                {"RTX 5080 16GB", "gpus", 0, "searchbar", "Alex Chen", now - 1800_000L * 7},
                {"rtx 5080", "gpus", 0, "searchbar", "Maya Lin", now - 1800_000L * 5},
                {"Nvidia RTX 5080", "all", 0, "voice", "Guest Shopper", now - 1800_000L * 3},
                {"rtx 5080", "all", 0, "searchbar", "Guest Shopper", now - 1800_000L * 1},
                {"Steam Deck OLED 1TB", "gaming", 0, "searchbar", "Alex Chen", now - 2400_000L * 4},
                {"steam deck oled", "all", 0, "searchbar", "Guest Shopper", now - 2400_000L * 2},
                {"steam deck oled", "gaming", 0, "voice", "Maya Lin", now - 1200_000L * 2},
                {"Intel Core Ultra 9 285K", "cpus", 0, "searchbar", "Guest Shopper", now - 3000_000L * 3},
                {"intel core ultra 9", "cpus", 0, "searchbar", "Alex Chen", now - 1500_000L * 2},
                {"Crucial T705 2TB PCIe 5.0 NVMe", "storage", 0, "searchbar", "Maya Lin", now - 2100_000L * 2},
                {"crucial t705 gen5 ssd", "storage", 0, "searchbar", "Guest Shopper", now - 900_000L}
        };
        for (Object[] s : seeds) {
            String raw = (String) s[0];
            String cat = (String) s[1];
            int count = (Integer) s[2];
            String src = (String) s[3];
            String actor = (String) s[4];
            long ts = (Long) s[5];
            String norm = normalizeQuery(raw);
            String grp = inferComponentGroup(norm, cat);
            store.addSearchLogAtTimestamp(raw, norm, cat, count, count == 0, grp, src, actor, ts);
        }
    }
}
