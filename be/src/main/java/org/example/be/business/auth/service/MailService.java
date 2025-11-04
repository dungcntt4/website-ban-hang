package org.example.be.business.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {
    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public void send(String to, String subject, String content) {
        var msg = new org.springframework.mail.SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(content);
        mailSender.send(msg);
    }
}
