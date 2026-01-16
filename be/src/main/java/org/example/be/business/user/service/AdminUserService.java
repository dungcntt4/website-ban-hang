package org.example.be.business.user.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.auth.repository.RefreshTokenRepository;
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
    private final RefreshTokenRepository refreshTokenRepo;

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
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ROLE_SUPER_ADMIN) {
            throw new RuntimeException("Không thể khóa tài khoản SUPER ADMIN");
        }

        user.setLocked(!user.isLocked());
        userRepo.save(user);
    }

    public void updateRole(Long id, String role, User currentUser) {

        // 1️⃣ Chỉ SUPER_ADMIN được phép
        if (currentUser.getRole() != User.Role.ROLE_SUPER_ADMIN) {
            throw new RuntimeException("Bạn không có quyền cập nhật vai trò");
        }

        User targetUser = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2️⃣ Không cho sửa SUPER_ADMIN
        if (targetUser.getRole() == User.Role.ROLE_SUPER_ADMIN) {
            throw new RuntimeException("Không thể chỉnh sửa SUPER ADMIN");
        }

        User.Role newRole;
        try {
            newRole = User.Role.valueOf(role);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Vai trò không hợp lệ");
        }

        // 3️⃣ Không cho gán SUPER_ADMIN qua API
        if (newRole == User.Role.ROLE_SUPER_ADMIN) {
            throw new RuntimeException("Không thể gán quyền SUPER ADMIN");
        }

        // 4️⃣ OK → update
        targetUser.setRole(newRole);
        userRepo.save(targetUser);
    }


    public void delete(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ROLE_SUPER_ADMIN) {
            throw new RuntimeException("Không thể xóa tài khoản SUPER ADMIN");
        }

        boolean profileCompleted =
                userProfileRepo.findDefaultByUserId(user.getId()).isPresent();

        if (profileCompleted) {
            throw new RuntimeException("Chỉ được xóa tài khoản chưa hoàn thành hồ sơ");
        }

        refreshTokenRepo.deleteByUserId(user.getId());
        userRepo.delete(user);
    }
}
