package org.example.be.business.auth.repository;

import org.example.be.business.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token); // tìm token reset mật khẩu //

    @Query("""
    select t from PasswordResetToken t
    join fetch t.user
    where t.token = :token
  """)
    Optional<PasswordResetToken> findByTokenWithUser(@Param("token") String token);
}
