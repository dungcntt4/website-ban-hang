package org.example.be.business.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    @Value("${app.google.client-id}")
    private String googleClientId;

    private final UserRepository users;
    private final TokenService tokenService;
    private final PasswordEncoder encoder;

    public record GoogleLoginResult(String access, String refreshRaw, User user) {}

    public GoogleLoginResult loginWithIdToken(String idTokenRaw, String userAgent, String ip) {
        var payload = verify(idTokenRaw); // throws nếu invalid
        String email = payload.getEmail();
        Boolean verified = payload.getEmailVerified();

        if (!Boolean.TRUE.equals(verified)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Google email not verified");
        }

        // Match theo email (bạn không dùng bảng user_identities)
        var userOpt = users.findByEmail(email.toLowerCase());
        User u = userOpt.orElseGet(() -> {
            // Tạo mới tài khoản dạng đã verify
            var nu = User.builder()
                    .email(email.toLowerCase())
                    .passwordHash(encoder.encode("!google-" + java.util.UUID.randomUUID())) // random, không dùng để login pass
                    .role(User.Role.ROLE_CUSTOMER)
                    .emailVerified(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .build();
            return users.save(nu);
        });
        if (!u.isEmailVerified()) {
            u.setEmailVerified(true);
        }
        u.setLastLoginAt(Instant.now());
        users.save(u);

        var pair = tokenService.issue(u.getId(), u.getRole().name(), null, userAgent, ip);
        return new GoogleLoginResult(pair.access(), pair.refreshRaw(), u);
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
