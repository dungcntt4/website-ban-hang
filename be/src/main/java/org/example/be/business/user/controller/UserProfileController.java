package org.example.be.business.user.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.user.model.dto.SaveUserProfileRequest;
import org.example.be.business.user.model.dto.UserProfileResponse;
import org.example.be.business.user.service.UserProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService service;

    /* ===== FE CŨ DÙNG ===== */
    @GetMapping("/me")
    public UserProfileResponse getDefault(
            @AuthenticationPrincipal User user
    ) {
        return service.getDefault(user);
    }

    @PutMapping("/me")
    public UserProfileResponse updateDefault(
            @AuthenticationPrincipal User user,
            @RequestBody SaveUserProfileRequest req
    ) {
        return service.create(user, req);
    }

    /* ===== API MỞ RỘNG ===== */
    @GetMapping
    public List<UserProfileResponse> getAll(
            @AuthenticationPrincipal User user
    ) {
        return service.getAll(user);
    }

    @PostMapping
    public UserProfileResponse create(
            @AuthenticationPrincipal User user,
            @RequestBody SaveUserProfileRequest req
    ) {
        return service.create(user, req);
    }

    @PutMapping("/{id}")
    public UserProfileResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody SaveUserProfileRequest req
    ) {
        return service.update(user, id, req);
    }

    @PutMapping("/{id}/default")
    public void setDefault(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        service.setDefault(user, id);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        service.delete(user, id);
    }
}
