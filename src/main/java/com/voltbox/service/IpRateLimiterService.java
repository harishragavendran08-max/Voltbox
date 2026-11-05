package com.voltbox.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bucket4j-based IP Rate Limiter Service for the Spring Boot backend.
 * Maintains per-IP token buckets to prevent API abuse and ensure high availability.
 */
@Service
public class IpRateLimiterService {

    public static final int GENERAL_API_CAPACITY = 120;
    public static final int SENSITIVE_API_CAPACITY = 30;
    private static final Duration REFILL_WINDOW = Duration.ofMinutes(1);

    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();

    /**
     * Resolves the token bucket for a given client IP and endpoint tier.
     */
    public Bucket resolveBucket(String clientIp, boolean isSensitiveRoute) {
        String bucketKey = (isSensitiveRoute ? "sensitive:" : "general:") + normalizeIp(clientIp);
        return ipBuckets.computeIfAbsent(bucketKey, key -> createNewBucket(isSensitiveRoute));
    }

    /**
     * Attempts to consume 1 token from the client IP's bucket.
     */
    public ConsumptionProbe tryConsume(String clientIp, boolean isSensitiveRoute) {
        Bucket bucket = resolveBucket(clientIp, isSensitiveRoute);
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    /**
     * Returns the configured bucket capacity for the given route tier.
     */
    public int getCapacity(boolean isSensitiveRoute) {
        return isSensitiveRoute ? SENSITIVE_API_CAPACITY : GENERAL_API_CAPACITY;
    }

    /**
     * Determines whether an API path belongs to the stricter sensitive rate-limit tier
     * (authentication, order checkout, password/account mutations).
     */
    public boolean isSensitiveEndpoint(String uri, String method) {
        if (uri == null) {
            return false;
        }
        if (uri.startsWith("/api/auth/") || uri.startsWith("/api/login") || uri.startsWith("/api/register")) {
            return true;
        }
        if ("POST".equalsIgnoreCase(method) && (uri.startsWith("/api/orders") || uri.startsWith("/api/checkout"))) {
            return true;
        }
        return false;
    }

    /**
     * Extracts the originating client IP address from reverse-proxy headers or socket remote address.
     */
    public String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String firstIp = xff.split(",")[0].trim();
            if (!firstIp.isEmpty()) {
                return normalizeIp(firstIp);
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return normalizeIp(realIp.trim());
        }
        String remoteAddr = request.getRemoteAddr();
        return normalizeIp(remoteAddr);
    }

    public String normalizeIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) {
            return "127.0.0.1";
        }
        String cleaned = rawIp.trim();
        if (cleaned.startsWith("::ffff:")) {
            cleaned = cleaned.substring(7);
        }
        if ("0:0:0:0:0:0:0:1".equals(cleaned) || "::1".equals(cleaned)) {
            return "127.0.0.1";
        }
        return cleaned;
    }

    private Bucket createNewBucket(boolean isSensitiveRoute) {
        int capacity = getCapacity(isSensitiveRoute);
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, REFILL_WINDOW)
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Clears all active buckets (used in testing).
     */
    public void resetAllBuckets() {
        ipBuckets.clear();
    }
}
