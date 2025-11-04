package org.example.be.business.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "email_verification_tokens",
        indexes = {
                @Index(name = "ix_email_verif_user", columnList = "user_id"),
                @Index(name = "ix_email_verif_token", columnList = "token", unique = true)
        }
)
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Token verify (base64url hoặc random UUID), có thể lưu hash */
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
