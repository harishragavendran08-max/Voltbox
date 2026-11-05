package com.voltbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltbox.service.IpRateLimiterService;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Spring Boot servlet filter that enforces Bucket4j IP-based rate limiting on /api/* endpoints.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private final IpRateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitFilter(IpRateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = rateLimiterService.extractClientIp(request);
        boolean isSensitive = rateLimiterService.isSensitiveEndpoint(uri, method);
        int limitCapacity = rateLimiterService.getCapacity(isSensitive);

        ConsumptionProbe probe = rateLimiterService.tryConsume(clientIp, isSensitive);

        response.setHeader("X-RateLimit-Limit", String.valueOf(limitCapacity));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, probe.getRemainingTokens())));

        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long waitForRefillSeconds = Math.max(1L, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(waitForRefillSeconds));
        response.setHeader("X-RateLimit-Retry-After-Seconds", String.valueOf(waitForRefillSeconds));

        Map<String, Object> errorBody = new LinkedHashMap<>();
        errorBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorBody.put("error", "Too Many Requests");
        errorBody.put("message", "Rate limit exceeded for IP " + clientIp + ". Please wait before retrying.");
        errorBody.put("retryAfterSeconds", waitForRefillSeconds);
        errorBody.put("limit", limitCapacity);

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
