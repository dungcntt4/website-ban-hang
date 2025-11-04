package org.example.be.business.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.PasswordResetToken;
import org.example.be.business.auth.repository.PasswordResetTokenRepository;
import org.example.be.business.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class PasswordService {
    private final UserRepository users;
    private final PasswordResetTokenRepository resetRepo;
    private final PasswordEncoder encoder;
    private final MailService mail;

    public void forgotPassword(String emailRaw) {
        String email = emailRaw.trim().toLowerCase();
        var userOpt = users.findByEmail(email);
        // Vì bảo mật: luôn trả 200, nhưng chỉ tạo token nếu user tồn tại
        if (userOpt.isPresent()) {
            String raw = java.util.UUID.randomUUID() + java.util.UUID.randomUUID().toString().replace("-", "");
            String token = java.util.Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            var t = PasswordResetToken.builder()
                    .user(userOpt.get())
                    .token(token)
                    .expiresAt(java.time.Instant.now().plus(java.time.Duration.ofMinutes(30)))
                    .used(false)
                    .build();
            resetRepo.save(t);

            String link = "http://localhost:5173/reset-password?token=" + token;
            mail.send(email, "Reset your password",
                    "Use this link to reset your password: " + link);
        }
    }

    @Transactional
    public void resetPassword(String tokenStr, String newPassword) {
        var t = resetRepo.findByTokenWithUser(tokenStr)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid token"));

        if (t.isUsed() || t.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Token expired or used");
        }

        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 72) {
            throw new ResponseStatusException(BAD_REQUEST, "Password length invalid (8–72)");
        }

        var u = t.getUser();                           // đã JOIN FETCH -> không lazy error
        u.setPasswordHash(encoder.encode(newPassword));

        t.setUsed(true);
        users.save(u);
        resetRepo.save(t);
    }
}

