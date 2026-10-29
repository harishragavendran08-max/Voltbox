/*
 * Decompiled with CFR 0.151.
 * 
 * Could not load the following classes:
 *  jakarta.mail.internet.MimeMessage
 *  org.springframework.beans.factory.annotation.Value
 *  org.springframework.mail.javamail.JavaMailSender
 *  org.springframework.mail.javamail.MimeMessageHelper
 *  org.springframework.stereotype.Component
 */
package com.voltbox;

import com.voltbox.model.Order;
import jakarta.mail.internet.MimeMessage;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class BillMailer {
    private final JavaMailSender mailer;
    @Value(value="${voltbox.mail.username:}")
    private String fromAddress;
    @Value(value="${voltbox.mail.password:}")
    private String appPassword;

    public BillMailer(JavaMailSender mailer) {
        this.mailer = mailer;
    }

    public boolean isReady() {
        return BillMailer.notBlank(this.fromAddress) && BillMailer.notBlank(this.appPassword);
    }

    public void send(String toAddress, String customerName, Order order) throws Exception {
        MimeMessage message = this.mailer.createMimeMessage();
        MimeMessageHelper mail = new MimeMessageHelper(message, true, "UTF-8");
        mail.setFrom(this.fromAddress, "Voltbox");
        mail.setTo(toAddress);
        mail.setSubject("Your Voltbox bill \u2014 " + order.getId());
        mail.setText(this.buildHtml(customerName, order), true);
        this.mailer.send(message);
    }

    private String buildHtml(String customerName, Order order) {
        StringBuilder rows = new StringBuilder();
        for (Order.Line line : order.getLines()) {
            rows.append("<tr>").append("<td style=\"padding:10px 0;border-bottom:1px solid #eee;\">").append("<strong>").append(BillMailer.esc(line.getTitle())).append("</strong><br>").append("<span style=\"color:#777;font-size:13px;\">").append(line.getQty()).append(" &times; $").append(BillMailer.money(line.getPrice())).append("</span></td>").append("<td style=\"padding:10px 0;border-bottom:1px solid #eee;").append("text-align:right;white-space:nowrap;\">$").append(BillMailer.money(line.getLineTotal())).append("</td>").append("</tr>");
        }
        String when = new SimpleDateFormat("d MMM yyyy 'at' hh:mm a").format(new Date(order.getPlacedAt()));
        return "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;color:#222;\"><div style=\"text-align:center;margin-bottom:24px;\"><div style=\"font-size:34px;\">&#9889;</div><h1 style=\"margin:6px 0 2px;font-size:24px;letter-spacing:1px;\">VOLTBOX</h1><div style=\"color:#888;font-size:12px;letter-spacing:2px;\">ELECTRONICS &amp; GADGETS</div></div><p style=\"font-size:15px;\">Hi " + BillMailer.esc(customerName) + ", here's your bill.</p><table style=\"width:100%;border-collapse:collapse;font-size:14px;\"><tr><td style=\"padding-bottom:12px;color:#888;font-size:12px;\">ORDER " + BillMailer.esc(order.getId()) + "</td><td style=\"padding-bottom:12px;color:#888;font-size:12px;text-align:right;\">" + BillMailer.esc(when) + "</td></tr>" + String.valueOf(rows) + "<tr><td style=\"padding-top:12px;color:#666;\">Subtotal</td><td style=\"padding-top:12px;text-align:right;\">$" + BillMailer.money(order.getSubtotal()) + "</td></tr><tr><td style=\"color:#666;\">Tax</td><td style=\"text-align:right;\">$" + BillMailer.money(order.getTax()) + "</td></tr><tr><td style=\"padding-top:8px;font-size:18px;font-weight:bold;\">Total</td><td style=\"padding-top:8px;font-size:18px;font-weight:bold;text-align:right;\">$" + BillMailer.money(order.getTotal()) + "</td></tr></table><p style=\"margin-top:20px;font-size:13px;color:#666;\">Paid $" + BillMailer.money(order.getAmountPaid()) + " via " + BillMailer.esc(order.getPaymentMethod()) + "<br>Shipped to " + BillMailer.esc(order.getShippingName()) + ", " + BillMailer.esc(order.getShippingAddress()) + "</p><p style=\"margin-top:28px;text-align:center;color:#888;font-size:12px;\">*** THANK YOU ***<br>You saved 0 electrons today.</p></div>";
    }

    private static String money(double n) {
        return String.format("%.2f", n);
    }

    private static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
