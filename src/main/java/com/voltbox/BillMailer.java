package com.voltbox;

import com.voltbox.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

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
}
