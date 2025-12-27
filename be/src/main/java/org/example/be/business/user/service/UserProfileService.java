package org.example.be.business.user.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.user.model.dto.SaveUserProfileRequest;
import org.example.be.business.user.model.dto.UserProfileResponse;
import org.example.be.business.user.model.entity.UserProfile;
import org.example.be.business.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository repository;

    /* ================= GET DEFAULT ================= */
    public UserProfileResponse getDefault(User user) {
        UserProfile profile = repository
                .findDefaultWithUser(user.getId())
                .orElseGet(() -> {
                    // TỰ TẠO PROFILE MẶC ĐỊNH
                    UserProfile p = UserProfile.builder()
                            .user(user)
                            .fullName("")
                            .phoneNumber("")
                            .address("")
                            .defaultProfile(true)
                            .build();
                    return repository.save(p);
                });

        return map(profile);
    }

    /* ================= GET ALL ================= */
    public List<UserProfileResponse> getAll(User user) {
        return repository.findAllWithUser(user.getId())
                .stream()
                .map(this::map)
                .toList();
    }

    /* ================= CREATE ================= */
    @Transactional
    public UserProfileResponse create(User user, SaveUserProfileRequest req) {
        validate(req);

        // clear default
        repository.findAllWithUser(user.getId())
                .forEach(p -> p.setDefaultProfile(false));

        UserProfile profile = UserProfile.builder()
                .user(user)
                .fullName(req.fullName().trim())
                .phoneNumber(req.phoneNumber().trim())
                .address(req.address().trim())
                .defaultProfile(true)
                .build();

        repository.save(profile);
        return map(profile);
    }

    /* ================= UPDATE ================= */
    public UserProfileResponse update(
            User user,
            Long profileId,
            SaveUserProfileRequest req
    ) {
        validate(req);

        UserProfile profile = repository.findById(profileId)
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new NullPointerException("Profile không tồn tại"));

        profile.setFullName(req.fullName().trim());
        profile.setPhoneNumber(req.phoneNumber().trim());
        profile.setAddress(req.address().trim());

        return map(repository.save(profile));
    }

    /* ================= SET DEFAULT ================= */
    @Transactional
    public void setDefault(User user, Long profileId) {

        repository.findAllWithUser(user.getId())
                .forEach(p -> p.setDefaultProfile(false));

        UserProfile profile = repository.findById(profileId)
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new NullPointerException("Profile không tồn tại"));

        profile.setDefaultProfile(true);
    }

    /* ================= DELETE ================= */
    public void delete(User user, Long profileId) {
        UserProfile profile = repository.findById(profileId)
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new NullPointerException("Profile không tồn tại"));

        repository.delete(profile);
    }

    /* ================= VALIDATE ================= */
    private void validate(SaveUserProfileRequest req) {
        if (!StringUtils.hasText(req.fullName())
                || !StringUtils.hasText(req.phoneNumber())
                || !StringUtils.hasText(req.address())) {
            throw new NullPointerException("Thông tin không được để trống");
        }

        if (!req.phoneNumber().matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
            throw new NullPointerException("Số điện thoại không hợp lệ");
        }
    }

    private UserProfileResponse map(UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .fullName(p.getFullName())
                .phoneNumber(p.getPhoneNumber())
                .email(p.getUser().getEmail())
                .address(p.getAddress())
                .isDefault(p.isDefaultProfile())
                .build();
    }
}
