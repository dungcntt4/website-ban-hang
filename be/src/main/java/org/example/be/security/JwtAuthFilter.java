package org.example.be.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Filter xác thực JWT:
 * - Đọc Authorization: Bearer <jwt>
 * - Parse & verify JWT lấy subject = userId
 * - Tải User từ DB và SET principal = User vào SecurityContext
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwt;            // tiện ích parse/verify JWT
    private final UserRepository users;   // repository lấy User

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String auth = req.getHeader(HttpHeaders.AUTHORIZATION);

        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                var claimsJws = jwt.parse(token);          // parse + verify
                var claims    = claimsJws.getPayload();

                Long userId = Long.valueOf(claims.getSubject()); // subject = id user
                User user = users.findById(userId).orElse(null);

                if (user != null) {
                    var authorities = List.of(new SimpleGrantedAuthority(user.getRole().name()));

                    // 🔑 principal = User (để @AuthenticationPrincipal User nhận được)
                    var authentication = new UsernamePasswordAuthenticationToken(
                            user,                 // principal
                            null,                 // credentials
                            authorities           // quyền
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    log.debug("JWT ok nhưng không tìm thấy user id={}", userId);
                }
            } catch (Exception e) {
                // Nếu token lỗi/hết hạn/sai chữ ký → bỏ qua, controller sẽ trả 401 nếu cần
                log.debug("JWT parse/verify failed: {}", e.getMessage());
            }
        }

        chain.doFilter(req, res);
    }
}
