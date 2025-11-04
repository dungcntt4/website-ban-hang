package org.example.be.business.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "ix_refresh_family", columnList = "familyId"),
                @Index(name = "ix_refresh_user", columnList = "user_id")
        }
)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Lưu HASH của refresh token, không lưu token raw */
    @Column(nullable = false, length = 255)
    private String tokenHash;

    /** Nhóm rotation */
    @Column(nullable = false, length = 64)
    private String familyId;

    @Column(nullable = false)
    private boolean revoked = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(length = 255)
    private String userAgent;

    @Column(length = 64)
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
