package org.example.be.business.cart.controller;
import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.cart.model.dto.CartItemResponse;
import org.example.be.business.cart.service.CartService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


import org.springframework.security.core.annotation.AuthenticationPrincipal;


@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public List<CartItemResponse> getCart(
            @AuthenticationPrincipal User user
    ) {
        return cartService.getCart(user);
    }

    @PostMapping
    public void addToCart(
            @AuthenticationPrincipal User user,
            @RequestBody AddToCartRequest req
    ) {
        cartService.addToCart(user, req.productVariantId(), req.quantity());
    }

    @PutMapping("/{id}")
    public void updateQty(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody UpdateQtyRequest req
    ) {
        cartService.updateQuantity(user, id, req.quantity());
    }

    @PostMapping("/delete-multiple")
    public void deleteMultiple(
            @AuthenticationPrincipal User user,
            @RequestBody List<UUID> ids
    ) {
        cartService.deleteMultiple(user, ids);
    }

    @PostMapping("/preview")
    public List<CartItemResponse> preview(
            @AuthenticationPrincipal User user,
            @RequestBody List<UUID> cartItemIds
    ) {
        return cartService.preview(user, cartItemIds);
    }
    /* ===== REQUEST DTO ===== */

    public record AddToCartRequest(UUID productVariantId, int quantity) {}
    public record UpdateQtyRequest(int quantity) {}
}


