package org.example.be.business.cart.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.cart.model.dto.CartItemResponse;
import org.example.be.business.cart.model.entity.CartItem;
import org.example.be.business.cart.repository.CartItemRepository;
import org.example.be.business.product.model.entity.InventoryItem;
import org.example.be.business.product.model.entity.ProductVariant;
import org.example.be.business.product.repository.InventoryRepository;
import org.example.be.business.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryItemRepository;

    /* ================= GET CART ================= */
    public List<CartItemResponse> getCart(User user) {
        return cartItemRepository.findByUser(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /* ================= ADD TO CART ================= */
    @Transactional
    public void addToCart(User user, UUID variantId, int quantity) {

        if (quantity <= 0) {
            throw new RuntimeException("Invalid quantity");
        }

        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        if (!variant.isActive()) {
            throw new RuntimeException("Product inactive");
        }

        InventoryItem inventory = inventoryItemRepository
                .findByVariant(variant)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        long available = inventory.getStockOnHand() - inventory.getStockReserved();
        if (available < quantity) {
            throw new RuntimeException("Not enough stock");
        }

        CartItem item = cartItemRepository
                .findByUserAndProductVariant(user, variant)
                .orElseGet(() -> {
                    CartItem ci = new CartItem();
                    ci.setUser(user);
                    ci.setProductVariant(variant);
                    ci.setQuantity(0);
                    return ci;
                });

        long newQty = item.getQuantity() + quantity;
        if (newQty > available) {
            throw new RuntimeException("Not enough stock");
        }

        item.setQuantity((int) newQty);
        cartItemRepository.save(item);
    }

    /* ================= UPDATE QTY ================= */
    @Transactional
    public void updateQuantity(User user, UUID cartItemId, int quantity) {

        if (quantity <= 0) {
            throw new RuntimeException("Invalid quantity");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden");
        }

        ProductVariant variant = item.getProductVariant();

        if (!variant.isActive()) {
            throw new RuntimeException("Product inactive");
        }

        InventoryItem inventory = inventoryItemRepository
                .findByVariant(variant)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        long available = inventory.getStockOnHand() - inventory.getStockReserved();

        if (quantity > available) {
            throw new RuntimeException("Not enough stock");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
    }

    /* ================= DELETE MULTIPLE ================= */
    @Transactional
    public void deleteMultiple(User user, List<UUID> ids) {
        cartItemRepository.deleteByUserAndIdIn(user, ids);
    }

    /* ================= PREVIEW CART (CHECKOUT) ================= */
    public List<CartItemResponse> preview(User user, List<UUID> cartItemIds) {

        if (cartItemIds == null || cartItemIds.isEmpty()) {
            throw new RuntimeException("Cart item ids empty");
        }

        List<CartItem> cartItems =
                cartItemRepository.findByUserAndIdIn(user, cartItemIds);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart empty");
        }

        for (CartItem item : cartItems) {

            ProductVariant v = item.getProductVariant();

            if (!v.isActive()) {
                throw new RuntimeException("Product inactive");
            }

            InventoryItem inv = inventoryItemRepository
                    .findByVariant(v)
                    .orElseThrow(() -> new RuntimeException("Inventory not found"));

            long available = inv.getStockOnHand() - inv.getStockReserved();
            if (available < item.getQuantity()) {
                throw new RuntimeException("Not enough stock");
            }
        }

        return cartItems.stream()
                .map(this::toResponse)
                .toList();
    }

    /* ================= MAPPER ================= */
    private CartItemResponse toResponse(CartItem item) {

        ProductVariant v = item.getProductVariant();
        InventoryItem inv = inventoryItemRepository.findByVariant(v).orElse(null);

        CartItemResponse res = new CartItemResponse();
        res.setId(item.getId());
        res.setQuantity(item.getQuantity());

        CartItemResponse.ProductVariantDto vDto =
                new CartItemResponse.ProductVariantDto();
        vDto.setId(v.getId());
        vDto.setName(v.getName());
        vDto.setSku(v.getSku());
        vDto.setPrice(v.getPrice());
        vDto.setDiscountPrice(v.getDiscountPrice());
        vDto.setDeleted(!v.isActive());
        vDto.setStock(inv != null
                ? Math.max(0, inv.getStockOnHand() - inv.getStockReserved())
                : 0);

        CartItemResponse.ProductDto pDto =
                new CartItemResponse.ProductDto();
        pDto.setId(v.getProduct().getId());
        pDto.setName(v.getProduct().getName());
        pDto.setSlug(v.getProduct().getSlug());
        pDto.setImage(v.getProduct().getThumbnailUrl());

        vDto.setProduct(pDto);
        res.setProductVariant(vDto);

        return res;
    }
}
