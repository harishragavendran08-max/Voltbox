package com.voltbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledJobs {
    private static final Logger log = LoggerFactory.getLogger(ScheduledJobs.class);

    @Scheduled(cron = "0 */5 * * * *")
    public void refreshCatalogCache() {
        log.info("Scheduled catalog maintenance tick");
    }
}
