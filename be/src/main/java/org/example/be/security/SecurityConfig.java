package org.example.be.security;

import lombok.RequiredArgsConstructor; // Lombok //
import org.springframework.context.annotation.*; // @Bean @Configuration //
import org.springframework.security.config.Customizer; // Customizer mặc định //
import org.springframework.security.config.annotation.web.builders.HttpSecurity; // HttpSecurity //
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; // bật WebSecurity //
import org.springframework.security.config.http.SessionCreationPolicy; // STATELESS //
import org.springframework.security.web.SecurityFilterChain; // chain //
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // vị trí filter //
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration @EnableWebSecurity @RequiredArgsConstructor // config bảo mật //
public class SecurityConfig { // class cấu hình //
    private final JwtAuthFilter jwtAuthFilter; // inject filter JWT //


    @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception { // định nghĩa chain //
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Cho phép các endpoint public
                        .requestMatchers("/api/auth/**", "/api/public/**", "/error","/api/payment/vnpay_return").permitAll()
                        // (tuỳ) tài liệu API
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Admin
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN","SUPER_ADMIN")
                        // Còn lại cần login
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class) // chèn filter JWT trước UsernamePwd //
                .cors(Customizer.withDefaults()); // bật CORS (có thể cấu hình CorsConfigurationSource riêng) //
        return http.build(); // build chain //
    }
    /**
     * Cấu hình CORS:
     * - allowCredentials(true) để gửi cookie (refresh_token)
     * - KHÔNG dùng "*" khi allowCredentials = true; phải nêu Origin cụ thể
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // Origin FE trong môi trường DEV
        cfg.setAllowedOrigins(List.of("http://localhost:5173"));
        // Nếu cần wildcard subdomain (prod), dùng:
        // cfg.setAllowedOriginPatterns(List.of("https://*.yourdomain.com"));

        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
        // Header sẽ được trình duyệt "thấy" ở response (tuỳ bạn cần gì)
        cfg.setExposedHeaders(List.of("Authorization"));
        // Cho phép gửi cookie
        cfg.setAllowCredentials(true);
        // Cache preflight
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}