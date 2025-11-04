package org.example.be.business.auth.repository;

import org.example.be.business.auth.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    // EmailVerificationTokenRepository.java
    @Query("""
  select t from EmailVerificationToken t
  join fetch t.user
  where t.token = :token
""")
    Optional<EmailVerificationToken> findByTokenWithUser(@Param("token") String token);
}
