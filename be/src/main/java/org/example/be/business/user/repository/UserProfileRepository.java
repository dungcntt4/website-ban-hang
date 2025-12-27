package org.example.be.business.user.repository;

import org.example.be.business.user.model.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("""
    select up
    from UserProfile up
    join fetch up.user u
    where u.id = :userId
""")
    List<UserProfile> findAllWithUser(Long userId);


    @Query("""
    select up
    from UserProfile up
    join fetch up.user u
    where u.id = :userId
      and up.defaultProfile = true
""")
    Optional<UserProfile> findDefaultWithUser(Long userId);

}
