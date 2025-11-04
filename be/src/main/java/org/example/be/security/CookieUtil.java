package org.example.be.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    @Value("${app.cookie.domain:}")
    private String domain;

    @Value("${app.cookie.secure:false}") // DEV: false; PROD: true
    private boolean secure;

    @Value("${app.cookie.samesite:Lax}") // DEV: Lax; PROD (cross-site): None
    private String sameSite;

    public void setRefreshCookie(HttpServletResponse res, String refreshRaw, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from("refresh_token", refreshRaw)
                .httpOnly(true)
                .secure(secure)                // ⬅️ dùng cấu hình, không hardcode
                .sameSite(sameSite)            // ⬅️ dùng cấu hình, không hardcode
                .path("/")
                .maxAge(maxAge);

        if (domain != null && !domain.isBlank()) {
            b.domain(domain);
        }

        res.addHeader(HttpHeaders.SET_COOKIE, b.build().toString());
    }

    public void clearRefreshCookie(HttpServletResponse res) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(secure)                // ⬅️ PHẢI giống hệt lúc set
                .sameSite(sameSite)            // ⬅️ PHẢI giống hệt lúc set
                .path("/")
                .maxAge(Duration.ZERO);

        if (domain != null && !domain.isBlank()) {
            b.domain(domain);
        }

        res.addHeader(HttpHeaders.SET_COOKIE, b.build().toString());
    }
}