package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.PurchaseReceiptCreateRequest;
import org.example.be.business.product.model.dto.PurchaseReceiptDetailResponse;
import org.example.be.business.product.model.dto.PurchaseReceiptListItemResponse;
import org.example.be.business.product.service.PurchaseReceiptService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/purchase-receipts")
public class PurchaseReceiptController {

    private final PurchaseReceiptService purchaseReceiptService;

    /**
     * Tạo phiếu nhập + các lô (purchase_receipt + purchase_receipt_item).
     *
     * Request body: PurchaseReceiptCreateRequest
     * Response: id của phiếu nhập vừa tạo.
     */
    @PostMapping
    public ResponseEntity<UUID> create(@RequestBody PurchaseReceiptCreateRequest request) {
        UUID id = purchaseReceiptService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    /**
     * Lấy chi tiết 1 phiếu nhập (header + danh sách dòng).
     *
     * GET /api/admin/purchase-receipts/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseReceiptDetailResponse> getDetail(@PathVariable UUID id) {
        PurchaseReceiptDetailResponse dto = purchaseReceiptService.getDetail(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * Danh sách phiếu nhập (simple, chưa phân trang).
     *
     * GET /api/admin/purchase-receipts
     */
    @GetMapping
    public ResponseEntity<List<PurchaseReceiptListItemResponse>> list() {
        List<PurchaseReceiptListItemResponse> list = purchaseReceiptService.listAll();
        return ResponseEntity.ok(list);
    }

    // Nếu sau này m muốn xoá / huỷ phiếu nhập thì thêm:
    // @DeleteMapping("/{id}")
    // public ResponseEntity<Void> delete(@PathVariable UUID id) {
    //     purchaseReceiptService.delete(id);
    //     return ResponseEntity.noContent().build();
    // }


}
