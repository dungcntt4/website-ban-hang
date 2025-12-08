package org.example.be.business.product.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.PurchaseReceiptCreateRequest;
import org.example.be.business.product.model.dto.PurchaseReceiptDetailResponse;
import org.example.be.business.product.model.dto.PurchaseReceiptListItemResponse;
import org.example.be.business.product.model.entity.InventoryItem;
import org.example.be.business.product.model.entity.ProductVariant;
import org.example.be.business.product.model.entity.PurchaseReceipt;
import org.example.be.business.product.model.entity.PurchaseReceiptItem;
import org.example.be.business.product.repository.InventoryRepository;
import org.example.be.business.product.repository.ProductVariantRepository;
import org.example.be.business.product.repository.PurchaseReceiptItemRepository;
import org.example.be.business.product.repository.PurchaseReceiptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseReceiptService {

    private final PurchaseReceiptRepository purchaseReceiptRepo;
    private final PurchaseReceiptItemRepository purchaseReceiptItemRepo;
    private final ProductVariantRepository variantRepo;
    private final InventoryRepository inventoryRepo;

    // ================== 1) CREATE (m đã có, t viết full lại cho dễ nhìn) ==================
    public UUID create(PurchaseReceiptCreateRequest req) {

        // nếu code null -> tự sinh mã PN-yyyymmdd-xxx
        String code = req.getCode();
        if (code == null || code.isBlank()) {
            code = generateCode();
        }

        PurchaseReceipt pr = new PurchaseReceipt();
        pr.setCode(code);
        pr.setSupplierName(req.getSupplierName());
        pr.setImportDate(
                Optional.ofNullable(req.getImportDate()).orElse(LocalDate.now())
        );
        // nếu có note:
        // pr.setNote(req.getNote());
        purchaseReceiptRepo.save(pr);

        // map variantId -> variant
        Set<UUID> variantIds = req.getItems() == null
                ? Set.of()
                : req.getItems().stream()
                .map(PurchaseReceiptCreateRequest.ItemDTO::getVariantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, ProductVariant> variantMap = variantRepo.findAllById(variantIds)
                .stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        for (PurchaseReceiptCreateRequest.ItemDTO line : req.getItems()) {
            if (line.getVariantId() == null) continue;
            ProductVariant variant = variantMap.get(line.getVariantId());
            if (variant == null) {
                throw new EntityNotFoundException("Variant not found: " + line.getVariantId());
            }

            Long qtyObj = line.getQuantity();
            long quantity = (qtyObj != null ? qtyObj : 0L);

            if (quantity <= 0) {
                continue;
            }


            BigDecimal importPrice = line.getImportPrice() != null
                    ? line.getImportPrice()
                    : BigDecimal.ZERO;

            PurchaseReceiptItem item = new PurchaseReceiptItem();
            item.setPurchaseReceipt(pr);
            item.setVariant(variant);
            item.setQuantity(quantity);
            item.setQuantityRemaining(quantity);
            item.setImportPrice(importPrice);
            purchaseReceiptItemRepo.save(item);

            // Cập nhật tồn kho tổng cho variant (InventoryItem)
            InventoryItem inv = inventoryRepo.findByVariantId(variant.getId())
                    .orElseGet(() -> {
                        InventoryItem i = new InventoryItem();
                        i.setVariant(variant);
                        i.setStockOnHand(0L);
                        i.setStockReserved(0L);
                        return i;
                    });

            inv.setStockOnHand(inv.getStockOnHand() + quantity);
            inventoryRepo.save(inv);
        }

        return pr.getId();
    }

    private String generateCode() {
        // ví dụ: PN-20250101-001 (m có thể custom sau)
        String base = "PN-" + LocalDate.now().toString().replace("-", "");
        long countToday = purchaseReceiptRepo.countByCodeStartingWith(base);
        long seq = countToday + 1;
        return base + "-" + String.format("%03d", seq);
    }

    // ================== 2) DETAIL ==================
    @Transactional(readOnly = true)
    public PurchaseReceiptDetailResponse getDetail(UUID id) {
        PurchaseReceipt pr = purchaseReceiptRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase receipt not found: " + id));

        List<PurchaseReceiptItem> items = purchaseReceiptItemRepo.findByPurchaseReceiptId(id);

        List<PurchaseReceiptDetailResponse.ItemDto> itemDtos = items.stream()
                .map(it -> {
                    ProductVariant v = it.getVariant();
                    BigDecimal lineAmount = it.getImportPrice()
                            .multiply(BigDecimal.valueOf(it.getQuantity()));

                    return PurchaseReceiptDetailResponse.ItemDto.builder()
                            .id(it.getId())
                            .variantId(v.getId())
                            .variantSku(v.getSku())
                            .variantName(v.getName())
                            .quantity(it.getQuantity())
                            .quantityRemaining(it.getQuantityRemaining())
                            .importPrice(it.getImportPrice())
                            .lineAmount(lineAmount)
                            .build();
                })
                .toList();

        return PurchaseReceiptDetailResponse.builder()
                .id(pr.getId())
                .code(pr.getCode())
                .importDate(pr.getImportDate())
                .supplierName(pr.getSupplierName())
                // .note(pr.getNote())
                .createdAt(pr.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    // ================== 3) LIST ==================
    @Transactional(readOnly = true)
    public List<PurchaseReceiptListItemResponse> listAll() {
        List<PurchaseReceipt> receipts = purchaseReceiptRepo.findAllByOrderByCreatedAtDesc();
        if (receipts.isEmpty()) return List.of();

        // load tất cả item của các phiếu này
        List<UUID> ids = receipts.stream().map(PurchaseReceipt::getId).toList();
        List<PurchaseReceiptItem> allItems = purchaseReceiptItemRepo.findByPurchaseReceiptIdIn(ids);

        Map<UUID, List<PurchaseReceiptItem>> itemsByReceipt = allItems.stream()
                .collect(Collectors.groupingBy(it -> it.getPurchaseReceipt().getId()));

        List<PurchaseReceiptListItemResponse> result = new ArrayList<>();

        for (PurchaseReceipt pr : receipts) {
            List<PurchaseReceiptItem> lines = itemsByReceipt.getOrDefault(pr.getId(), List.of());

            long totalQty = lines.stream()
                    .mapToLong(PurchaseReceiptItem::getQuantity)
                    .sum();

            BigDecimal totalAmount = lines.stream()
                    .map(it -> it.getImportPrice()
                            .multiply(BigDecimal.valueOf(it.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            PurchaseReceiptListItemResponse dto = PurchaseReceiptListItemResponse.builder()
                    .id(pr.getId())
                    .code(pr.getCode())
                    .importDate(pr.getImportDate())
                    .supplierName(pr.getSupplierName())
                    .totalQuantity(totalQty)
                    .itemCount(lines.size())
                    .totalAmount(totalAmount)
                    .createdAt(pr.getCreatedAt())
                    .build();

            result.add(dto);
        }

        return result;
    }
}
