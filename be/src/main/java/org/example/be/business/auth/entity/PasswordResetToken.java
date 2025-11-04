package org.example.be.business.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "password_reset_tokens",
        indexes = {
                @Index(name = "ix_pwdreset_user", columnList = "user_id"),
                @Index(name = "ix_pwdreset_token", columnList = "token", unique = true)
        }
)
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Token 1 lần (one-time use) cho reset password */
    @Column(nullable = false, length = 150, unique = true)
    private String token;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
