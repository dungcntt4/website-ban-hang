package org.example.be.business.user.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.UserRepository;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.order.repository.OrderRepository;
import org.example.be.business.user.model.dto.AdminUserResponse;
import org.example.be.business.user.model.dto.CreateUserRequest;
import org.example.be.business.user.model.dto.UserProfileResponse;
import org.example.be.business.user.model.entity.UserProfile;
import org.example.be.business.user.repository.UserProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileRepository userProfileRepo;
    private final OrderRepository orderRepo;

    public Page<AdminUserResponse> getPage(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<User> result =
                (search != null && !search.isBlank())
                        ? userRepo.findByEmailContainingIgnoreCase(search.trim(), pageable)
                        : userRepo.findAll(pageable);

        return result.map(u -> {

            UserProfile profile =
                    userProfileRepo.findDefaultByUserId(u.getId()).orElse(null);

            boolean profileCompleted = profile != null;

            long totalOrders =
                    orderRepo.countByUserIdAndStatus(
                            u.getId(),
                            OrderStatus.DA_THANH_TOAN
                    );

            BigDecimal totalSpent =
                    orderRepo.sumTotalAmountByUserIdAndStatus(
                            u.getId(),
                            OrderStatus.DA_THANH_TOAN
                    );

            return AdminUserResponse.builder()
                    .id(u.getId())
                    .email(u.getEmail())
                    .role(u.getRole().name())
                    .locked(u.isLocked())

                    .fullName(profile != null ? profile.getFullName() : null)
                    .phoneNumber(profile != null ? profile.getPhoneNumber() : null)
                    .profileCompleted(profileCompleted)

                    .totalOrders(totalOrders)
                    .totalSpent(totalSpent == null ? BigDecimal.ZERO : totalSpent)
                    .build();
        });
    }


    public void create(CreateUserRequest req) {
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.valueOf(req.getRole()))
                .emailVerified(true)
                .locked(false)
                .failedLoginAttempts(0)
                .build();
        userRepo.save(user);
    }

    public void toggleLock(Long id) {
        User user = userRepo.findById(id).orElseThrow();
        user.setLocked(!user.isLocked());
        userRepo.save(user);
    }

    public void updateRole(Long id, String role) {
        User user = userRepo.findById(id).orElseThrow();
        user.setRole(User.Role.valueOf(role));
        userRepo.save(user);
    }

    public void delete(Long id) {
        userRepo.deleteById(id);
    }
}
