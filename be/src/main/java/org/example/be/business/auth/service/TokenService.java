package org.example.be.business.auth.service;


import lombok.RequiredArgsConstructor; // Lombok constructor //
import org.example.be.business.auth.entity.RefreshToken;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.RefreshTokenRepository;
import org.example.be.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value; // @Value //
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service; // @Service //
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*; // Instant, ChronoUnit //
import java.time.temporal.ChronoUnit;
import java.util.*; // UUID //
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service @RequiredArgsConstructor // service + tạo ctor cho final fields //
public class TokenService { // quản lý cấp/rotate/revoke refresh token //
    private final JwtUtil jwt; // tiện ích JWT //
    private final RefreshTokenRepository repo; // repo thao tác DB //
    private final PasswordEncoder encoder; // dùng để hash/so khớp refreshRaw //


    @Value("${app.jwt.refresh-ttl-days:30}")
    private long refreshTtlDays; // TTL refresh (ngày) //


    public record Pair(String access, String refreshRaw) {
    } // cặp access + refreshRaw trả cho client //


    public Pair issue(Long userId, String role, String familyId, String ua, String ip) { // phát token mới //
        if (familyId == null) familyId = UUID.randomUUID().toString(); // nếu chưa có family → tạo //
        String access = jwt.generateAccessToken(userId, role); // tạo access token //



        String u1 = UUID.randomUUID().toString().replace("-", ""); // 32
        String u2 = UUID.randomUUID().toString().replace("-", ""); // 32
        String refreshRaw = u1 + u2; // 64 ký tự (<=72) // raw refresh gửi cho client //
        log.info("Issued raw = {}", refreshRaw);

        String hash = encoder.encode(refreshRaw); // băm refresh để lưu DB (không lưu raw) //


        RefreshToken rt = RefreshToken.builder() // build entity //
                .user(User.builder().id(userId).build()) // tham chiếu user theo id (lazy) //
                .tokenHash(hash) // lưu hash //
                .familyId(familyId) // set nhóm rotation //
                .revoked(false) // chưa thu hồi //
                .expiresAt(Instant.now().plus(refreshTtlDays, ChronoUnit.DAYS)) // hạn dùng //
                .userAgent(ua) // UA để theo dõi //
                .ipAddress(ip) // IP để theo dõi //
                .build(); // hoàn tất entity //
        repo.save(rt); // lưu DB //
        return new Pair(access, refreshRaw); // trả về access + refreshRaw //
    }

    @Transactional
    public Pair rotate(String refreshRaw) {
        if (refreshRaw == null || refreshRaw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing refresh token");
        }
        System.out.println("re:  "+ refreshRaw);
        boolean test = encoder.matches(refreshRaw, "$2a$12$kJ6H0OJHilC1xKX1oximaepUf5QpIs1dzIPVY/E9LZ/Btme3XFD6O");
        System.out.println("test: "+test);
        Instant now = Instant.now();

        // 1️⃣ Lọc sơ bộ trên DB (revoked=false & còn hạn)
        List<RefreshToken> candidates = repo.findByRevokedFalseAndExpiresAtAfter(now);
        if (candidates.isEmpty()) {
            log.warn("Không có token nào hợp lệ trong DB (revoked=false & expiresAt>now)");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        // 2️⃣ So khớp từng hash trong tập nhỏ bằng BCrypt
        RefreshToken current = candidates.stream()
                .filter(rt -> encoder.matches(refreshRaw, rt.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> {
                    log.warn("Không khớp refresh token nào với raw {}", refreshRaw.substring(0, 8));
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
                });

        // 3️⃣ Trong @Transactional nên getUser() an toàn
        User u = current.getUser();
        if (u == null) {
            log.error("Token {} không có user liên kết", current.getId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        if (u.getRole() == null) {
            log.error("User {} không có role", u.getId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User role invalid");
        }

        // 4️⃣ Issue token mới, giữ nguyên familyId / UA / IP
        Pair pair = issue(
                u.getId(),
                u.getRole().name(),
                current.getFamilyId(),
                current.getUserAgent(),
                current.getIpAddress()
        );

        // 5️⃣ Revoke token cũ sau khi issue thành công
        current.setRevoked(true);
        repo.save(current);

        log.info("🧩 Refresh token rotated thành công cho user {} (familyId={})", u.getId(), current.getFamilyId());
        return pair;
    }

    public void revokeFamily(String familyId) { // revoke toàn bộ token trong cùng family //
        var list = repo.findByFamilyId(familyId); // lấy danh sách cùng family //
    }
}