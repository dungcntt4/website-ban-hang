package org.example.be.business.auth.repository;

import org.example.be.business.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash); // tìm theo hash của refresh token //
    List<RefreshToken> findByUserId(Long userId); // lấy tất cả token theo user //
    List<RefreshToken> findByFamilyId(String familyId); // lấy theo nhóm rotation (family) //
    List<RefreshToken> findByRevokedFalseAndExpiresAtAfter(Instant now);
    @EntityGraph(attributePaths = "user")
    Optional<RefreshToken> findByTokenHashAndRevokedFalseAndExpiresAtAfter(
            String tokenHash, Instant now
    );
    List<RefreshToken> findByFamilyIdAndRevokedFalseAndExpiresAtAfter(
            String familyId,
            Instant now
    );
    void deleteByUserId(Long userId);
}
