package org.example.be.security;

import io.jsonwebtoken.*; // JJWT API //
import io.jsonwebtoken.security.Keys; // tạo key HMAC //
import org.springframework.beans.factory.annotation.Value; // @Value lấy từ application.yml //
import org.springframework.stereotype.Component; // @Component //
import java.nio.charset.StandardCharsets; // charset UTF-8 //
import java.time.*; // Instant, ChronoUnit //
import java.time.temporal.ChronoUnit;
import java.util.*; // Date //


@Component // bean Spring //
public class JwtUtil { // tiện ích phát/parse JWT //
    @Value("${app.jwt.secret}") private String secret; // bí mật 256-bit (base64 hoặc chuỗi >= 32 bytes) //
    @Value("${app.jwt.access-ttl-minutes:15}") private long ttlMin; // TTL access token (phút) //


    public String generateAccessToken(Long userId, String role) { // tạo access token //
        Instant now = Instant.now(); // thời điểm hiện tại //
        return Jwts.builder() // builder JWT //
                .setSubject(userId.toString()) // subject = id user //
                .claim("role", role) // nhúng role làm claim //
                .setIssuedAt(Date.from(now)) // iat //
                .setExpiration(Date.from(now.plus(ttlMin, ChronoUnit.MINUTES))) // exp //
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS512) // ký HS512 //
                .compact(); // sinh chuỗi token //
    }


    public Jws<Claims> parse(String token) { // parse & verify token //
        return Jwts.parser() // tạo parser //
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))) // thiết lập key verify //
                .build().parseSignedClaims(token); // parse claims + verify chữ ký //
    }
}
