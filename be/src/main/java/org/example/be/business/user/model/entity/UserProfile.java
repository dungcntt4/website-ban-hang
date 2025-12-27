package org.example.be.business.user.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.business.auth.entity.User;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_profiles",
        indexes = {
                @Index(name = "ix_user_profiles_user", columnList = "user_id"),
                @Index(name = "ix_user_profiles_default", columnList = "user_id,is_default")
        }
)
public class UserProfile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ===== N-1 User ===== */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(name = "is_default", nullable = false)
    private boolean defaultProfile = false;

}
