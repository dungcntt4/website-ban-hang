package org.example.be.business.user.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.user.model.dto.AdminUserResponse;
import org.example.be.business.user.model.dto.CreateUserRequest;
import org.example.be.business.user.model.dto.UpdateRoleRequest;
import org.example.be.business.user.service.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping
    public Page<AdminUserResponse> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.getPage(page, size, search);
    }

    @PostMapping
    public void create(@RequestBody CreateUserRequest req) {
        service.create(req);
    }

    @PutMapping("/{id}/toggle-lock")
    public void toggleLock(@PathVariable Long id) {
        service.toggleLock(id);
    }

    @PutMapping("/{id}/role")
    public void updateRole(
            @PathVariable Long id,
            @RequestBody UpdateRoleRequest req
    ) {
        service.updateRole(id, req.getRole());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}