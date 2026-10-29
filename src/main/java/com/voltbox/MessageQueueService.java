package com.voltbox;

import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MessageQueueService {
    private static final Logger log = LoggerFactory.getLogger(MessageQueueService.class);

    private final RabbitTemplate rabbitTemplate;

    public MessageQueueService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Async("backgroundExecutor")
    public void publish(String eventType, Map<String, Object> payload) {
        String routingKey = "voltbox.events." + eventType;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, payload);
        log.info("Queue event {} at {} payload={}", eventType, LocalDateTime.now(), payload);
    }
}
