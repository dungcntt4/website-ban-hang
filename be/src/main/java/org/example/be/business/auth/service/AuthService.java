package org.example.be.business.auth.service;

import lombok.RequiredArgsConstructor; // Lombok //
import org.example.be.business.auth.dto.LoginRequest;
import org.example.be.business.auth.dto.RegisterRequest;
import org.example.be.business.auth.entity.EmailVerificationToken;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.EmailVerificationTokenRepository;
import org.example.be.business.auth.repository.PasswordResetTokenRepository;
import org.example.be.business.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder; // encoder //
import org.springframework.stereotype.Service; // @Service //
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

import java.time.*; // Instant //

import static org.springframework.http.HttpStatus.BAD_REQUEST;


@Service @RequiredArgsConstructor // service + ctor //
public class AuthService { // nghiệp vụ auth //
    private final UserRepository users; // repo user //
    private final PasswordEncoder encoder; // encoder mật khẩu //
    private final TokenService tokens; // service token //
    private final EmailVerificationTokenRepository emailTokens; // repo email token //
    private final PasswordResetTokenRepository resetTokens; // repo reset token //
    private final MailService mail;

    public void register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    BAD_REQUEST, "Email exists");
        }
        var u = users.save(User.builder()
                .email(email)
                .passwordHash(encoder.encode(r.password()))
                .role(User.Role.ROLE_CUSTOMER)
                .emailVerified(false)
                .locked(false).failedLoginAttempts(0)
                .build());

        // tạo verify token
        String raw = java.util.UUID.randomUUID() + java.util.UUID.randomUUID().toString().replace("-", "");
        var token = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        var t = EmailVerificationToken.builder()
                .user(u)
                .token(token)
                .expiresAt(java.time.Instant.now().plus(java.time.Duration.ofHours(24)))
                .used(false)
                .build();
        emailTokens.save(t);

        // gửi email
        String link = "http://localhost:5173/verify-email?token=" + token; // FE route của bạn
        mail.send(u.getEmail(), "Verify your email",
                "Click this link to verify your email: " + link);
    }

    @Transactional
    public void verifyEmail(String token) {
        var t = emailTokens.findByTokenWithUser(token)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid token"));

        if (t.isUsed() || t.getExpiresAt().isBefore(java.time.Instant.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Token expired or used");
        }

        var u = t.getUser();               // ĐÃ được fetch, không còn proxy lazy
        u.setEmailVerified(true);

        t.setUsed(true);
        // dirty checking sẽ tự flush user & token; nếu muốn rõ ràng vẫn có thể save:
        users.save(u);
        emailTokens.save(t);
    }


    public TokenService.Pair login(LoginRequest r, String ua, String ip) {

        var u = users.findByEmail(r.email().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));

        Instant now = Instant.now();

        // 1. Nếu đang bị khóa và CHƯA HẾT HẠN → chặn
        if (u.isLocked()) {
            if (u.getLockUntil() != null && u.getLockUntil().isAfter(now)) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản bị khóa 30 phút do nhập sai quá nhiều lần");
            } else {
                // Hết hạn khóa → mở khóa
                u.setLocked(false);
                u.setLockUntil(null);
                u.setFailedLoginAttempts(0);
            }
        }

        // 2. Sai mật khẩu
        if (!encoder.matches(r.password(), u.getPasswordHash())) {
            int failCount = u.getFailedLoginAttempts() + 1;
            u.setFailedLoginAttempts(failCount);

            // 3. Nhập sai quá 5 lần → khóa 30 phút
            if (failCount >= 5) {
                u.setLocked(true);
                u.setLockUntil(now.plus(Duration.ofMinutes(30)));
            }

            users.save(u);
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }

        // 4. Kiểm tra xác thực email
        if (!u.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản chưa được xác thực email, vui lòng kiểm tra hộp thư");
        }

        // 5. Đăng nhập thành công → reset trạng thái lỗi
        u.setFailedLoginAttempts(0);
        u.setLocked(false);
        u.setLockUntil(null);
        u.setLastLoginAt(now);
        users.save(u);

        // 6. Phát token
        return tokens.issue(u.getId(), u.getRole().name(), null, ua, ip);
    }



    public TokenService.Pair rotate(String refreshRaw) { return tokens.rotate(refreshRaw); }
    // xoay vòng → cấp access mới //


    public void logout(String refreshRaw) { // đăng xuất //
// Tuỳ chiến lược: có thể tìm token hiện tại và revoke //
// hoặc chỉ xoá cookie phía client nếu không map được raw→hash //
    }
}