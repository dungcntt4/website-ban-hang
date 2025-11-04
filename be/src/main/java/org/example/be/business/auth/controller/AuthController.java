package org.example.be.business.auth.controller;


import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.business.auth.dto.*;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.UserRepository;
import org.example.be.business.auth.service.AuthService;
import org.example.be.business.auth.service.GoogleAuthService;
import org.example.be.business.auth.service.PasswordService;
import org.example.be.security.CookieUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.security.SignatureException;
import java.time.Duration;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth") // prefix chung //
@RequiredArgsConstructor // tạo ctor //
public class AuthController { // điều khiển auth //
    private final AuthService auth; // service auth //
    private final CookieUtil cookieUtil; // tiện ích cookie //
    private final GoogleAuthService googleAuthService;
    private final PasswordService passwordService;
    private final UserRepository users;

    @PostMapping("/register") // POST /api/auth/register //
    public ResponseEntity<Void> register(@RequestBody @Valid RegisterRequest r) { // nhận body hợp lệ //
        auth.register(r); // gọi service đăng ký //
        return ResponseEntity.ok().build(); // 200 OK (có thể trả 201/204 tuỳ design) //
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestBody @Valid VerifyEmailRequest req) {
        auth.verifyEmail(req.token());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    // POST /api/auth/login //
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest r, // body login //
                                               @RequestHeader(value="User-Agent", required=false) String ua, // lấy UA nếu có //
                                               HttpServletRequest req, HttpServletResponse res) { // req/res để set cookie //


        var pair = auth.login(r, ua, realIp(req)); // gọi service → nhận access + refreshRaw //
        cookieUtil.setRefreshCookie(res, pair.refreshRaw(), Duration.ofDays(30)); // set refresh cookie //
        var u = users.findByEmail(r.email().trim().toLowerCase()).get();
        var me = new UserDTO(u.getId(), u.getEmail(), u.getRole(), u.isEmailVerified());
        return ResponseEntity.ok(new LoginResponse(pair.access(), me)); // trả 200 + body //
    }


    // AuthController.java
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshRaw,
            HttpServletResponse res) {

        if (refreshRaw == null || refreshRaw.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Missing refresh_token cookie"));
        }

        try {
            log.info("Client raw = {}", refreshRaw);

            // ⬇️ nhận cặp mới
            var pair = auth.rotate(refreshRaw);

            // ⬇️ QUAN TRỌNG: set cookie refresh mới để lần reload/tab mới vẫn giữ phiên
            cookieUtil.setRefreshCookie(res, pair.refreshRaw(), Duration.ofDays(30));

            return ResponseEntity.ok(Map.of("accessToken", pair.access()));

        } catch (org.springframework.web.server.ResponseStatusException ex) {
            // refresh invalid/expired → xoá cookie để FE chuyển login
            cookieUtil.clearRefreshCookie(res);
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));

        } catch (Exception e) {
            cookieUtil.clearRefreshCookie(res);
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid or expired refresh token"));
        }
    }
    


    private String realIp(HttpServletRequest req) { // lấy IP thật (đằng sau reverse proxy) //
        String xff = req.getHeader("X-Forwarded-For"); // đọc XFF //
        return xff != null ? xff.split(",")[0].trim() : req.getRemoteAddr(); // nếu có → lấy IP đầu tiên; ngược lại lấy remoteAddr //
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> google(@RequestBody @jakarta.validation.Valid GoogleLoginRequest req,
                                                @RequestHeader(value="User-Agent", required=false) String ua,
                                                HttpServletRequest httpReq,
                                                HttpServletResponse httpRes) {
        var result = googleAuthService.loginWithIdToken(req.idToken(), ua, realIp(httpReq));
        cookieUtil.setRefreshCookie(httpRes, result.refreshRaw(), java.time.Duration.ofDays(30));


        var me = new UserDTO(result.user().getId(), result.user().getEmail(),
                result.user().getRole(), result.user().isEmailVerified());

        return ResponseEntity.ok(new LoginResponse(result.access(), me));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgot(@RequestBody @Valid ForgotPasswordRequest req) {
        passwordService.forgotPassword(req.email());
        return ResponseEntity.ok().build(); // luôn 200
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> reset(@RequestBody @Valid ResetPasswordRequest req) {
        passwordService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO dto = new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.isEmailVerified()
        );
        return ResponseEntity.ok(dto);
    }
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse res) {
        ResponseCookie kill = ResponseCookie.from("refresh_token", "")
                .httpOnly(true).path("/").maxAge(0).build();
        res.addHeader(HttpHeaders.SET_COOKIE, kill.toString());
        return ResponseEntity.ok().build();
    }


}