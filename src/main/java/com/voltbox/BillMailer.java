package com.voltbox;

import com.voltbox.model.Order;
import com.voltbox.model.PriceAlert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class BillMailer {
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromUser;

    public boolean isReady() {
        return mailSender != null && fromUser != null && !fromUser.isBlank();
    }

    public void sendBill(String toEmail, Order order) {
        if (!isReady()) {
            throw new IllegalStateException("Mail isn't configured on this server.");
        }
        StringBuilder body = new StringBuilder();
        body.append("VOLTBOX — HARDWARE BENCH RECEIPT\n");
        body.append("Order ID: ").append(order.id).append("\n");
        body.append("Ship To: ").append(order.shippingName).append(" — ").append(order.shippingAddress).append("\n\n");
        for (Order.Line line : order.lines) {
            body.append(String.format("%dx %s — $%.2f\n", line.qty, line.title, line.price * line.qty));
        }
        body.append(String.format("\nSubtotal: $%.2f\nTax: $%.2f\nTotal Paid: $%.2f\n", order.subtotal, order.tax, order.total));

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromUser);
        msg.setTo(toEmail);
        msg.setSubject("Your Voltbox Receipt (" + order.id + ")");
        msg.setText(body.toString());
        mailSender.send(msg);
    }

    public Map<String, Object> sendPriceDropAlert(PriceAlert alert, double newPrice) {
        double cleanNew = Math.round(newPrice * 100.0) / 100.0;
        double baseline = Math.max(alert.priceAtCreation, Math.max(alert.targetPrice, cleanNew));
        double savingsAmount = Math.max(0.0, Math.round((baseline - cleanNew) * 100.0) / 100.0);
        int savingsPct = baseline > 0 ? (int) Math.round((savingsAmount / baseline) * 100.0) : 0;

        String subject = String.format(
                "Price Drop Alert: %s dropped to $%.2f (Below your $%.2f threshold)",
                alert.productTitle, cleanNew, alert.targetPrice);

        StringBuilder body = new StringBuilder();
        body.append("VOLTBOX HARDWARE BENCH — PRICE DROP ALERT\n");
        body.append("--------------------------------------------------\n");
        body.append("Component: ").append(alert.productTitle).append("\n");
        body.append("Part SKU:  ").append(alert.sku != null ? alert.sku : ("VB-PRT-" + alert.productId)).append("\n\n");
        body.append("Good news! The component you're watching has dropped below your target price threshold:\n");
        body.append(String.format("  • New Live Price:     $%.2f\n", cleanNew));
        body.append(String.format("  • Your Alert Target:  $%.2f\n", alert.targetPrice));
        body.append(String.format("  • Original Price:     $%.2f\n", alert.priceAtCreation));
        if (savingsAmount > 0) {
            body.append(String.format("  • Total Savings:      $%.2f (%d%% off)\n", savingsAmount, savingsPct));
        }
        body.append("\nOrder now on Voltbox before stock runs out: /?product=").append(alert.productId).append("\n");

        if (isReady()) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromUser);
                msg.setTo(alert.email);
                msg.setSubject(subject);
                msg.setText(body.toString());
                mailSender.send(msg);
            } catch (Exception ignored) {}
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("alertId", alert.id);
        payload.put("productId", alert.productId);
        payload.put("productTitle", alert.productTitle);
        payload.put("sku", alert.sku);
        payload.put("toEmail", alert.email);
        payload.put("targetPrice", alert.targetPrice);
        payload.put("previousPrice", alert.priceAtCreation);
        payload.put("newPrice", cleanNew);
        payload.put("savingsAmount", savingsAmount);
        payload.put("savingsPct", savingsPct);
        payload.put("subject", subject);
        payload.put("body", body.toString());
        payload.put("sentAt", System.currentTimeMillis());
        return payload;
    }
}
