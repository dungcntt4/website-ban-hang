package org.example.be.business.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    @Value("${app.google.client-id}")
    private String googleClientId;

    private final UserRepository users;
    private final TokenService tokenService;
    private final PasswordEncoder encoder;

    public record GoogleLoginResult(String access, String refreshRaw, User user) {}

    public GoogleLoginResult loginWithIdToken(
            String idTokenRaw,
            String userAgent,
            String ip
    ) {
        var payload = verify(idTokenRaw); // throws nếu invalid

        String email = payload.getEmail();
        Boolean verified = payload.getEmailVerified();

        if (!Boolean.TRUE.equals(verified)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Google email not verified");
        }

        User u = users.findByEmail(email.toLowerCase())
                .orElseGet(() -> users.save(
                        User.builder()
                                .email(email.toLowerCase())
                                .passwordHash(
                                        encoder.encode("!google-" + UUID.randomUUID())
                                )
                                .role(User.Role.ROLE_CUSTOMER)
                                .emailVerified(true)
                                .locked(false)
                                .failedLoginAttempts(0)
                                .build()
                ));

        Instant now = Instant.now();

        // 🔒 CHẶN TÀI KHOẢN BỊ KHÓA (GIỐNG LOGIN THƯỜNG)
        if (u.isLocked()) {
            if (u.getLockUntil() != null && u.getLockUntil().isAfter(now)) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản đang bị khóa, vui lòng thử lại sau");
            } else {
                u.setLocked(false);
                u.setLockUntil(null);
                u.setFailedLoginAttempts(0);
            }
        }

        // Google login = email đã verify
        if (!u.isEmailVerified()) {
            u.setEmailVerified(true);
        }

        // Login thành công → reset trạng thái lỗi
        u.setFailedLoginAttempts(0);
        u.setLastLoginAt(now);
        users.save(u);

        var pair = tokenService.issue(
                u.getId(),
                u.getRole().name(),
                null,
                userAgent,
                ip
        );

        return new GoogleLoginResult(
                pair.access(),
                pair.refreshRaw(),
                u
        );
    }


    private GoogleIdToken.Payload verify(String idTokenString) {
        try {
            var transport = new NetHttpTransport();
            var jsonFactory = JacksonFactory.getDefaultInstance();
            var verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) throw new IllegalArgumentException("Invalid Google ID token");
            return idToken.getPayload();
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Google token verify failed");
        }
    }
}
