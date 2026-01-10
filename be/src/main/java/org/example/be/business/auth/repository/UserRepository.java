package org.example.be.business.auth.repository;

import org.example.be.business.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    @Query("""
    SELECT COUNT(u)
    FROM User u
    WHERE u.role = 'ROLE_CUSTOMER'
""")
    long countCustomers();
    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);

}
