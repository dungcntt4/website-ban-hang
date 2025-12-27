package org.example.be.business.payment.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.HmacUtils;
import org.example.be.business.order.service.OrderService;
import org.example.be.business.payment.model.dto.*;
import org.example.be.business.payment.service.VNPayService;
import org.example.be.business.payment.service.VnPayVerifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderService orderService;
    /**
     * FE đang gửi form-urlencoded: amount, vnp_OrderInfo, ordertype, language...
     * Anh giữ đúng format FE của bạn, nhưng thêm orderCode để BE lookup order.
     */
    @PostMapping(value = "/vnpay-create", consumes = "application/x-www-form-urlencoded")
    public Map<String, Object> create(
            @RequestParam String orderCode,
            @RequestParam long amount,
            @RequestParam(name = "vnp_OrderInfo") String orderInfo,
            @RequestParam(name = "ordertype", required = false) String orderType,
            @RequestParam(name = "language", required = false) String language,
            HttpServletRequest request
    ) throws Exception {

        // map sang DTO cho gọn (KHÔNG đổi contract)
        VNPayCreateRequest dto = new VNPayCreateRequest();
        dto.setOrderCode(orderCode);
        dto.setAmount(BigDecimal.valueOf(amount));
        dto.setOrderInfo(orderInfo);
        dto.setOrderType(orderType);
        dto.setLanguage(language);

        // gọi service mới nhưng logic ký = create-qr
        return vnPayService.createPaymentLikeCreateQr(dto, request);
    }

    @GetMapping("/vnpay_return")
    public void vnpayReturn(
            @RequestParam Map<String, String> params,
            HttpServletResponse response
    ) throws Exception {

        String orderCode = params.getOrDefault("vnp_TxnRef", "");

        // ===== 1️⃣ VERIFY CHỮ KÝ (BẮT BUỘC) =====
        String secureHash = params.get("vnp_SecureHash");

        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        List<String> keys = new ArrayList<>(fields.keySet());
        Collections.sort(keys);

        StringBuilder hashData = new StringBuilder();
        for (Iterator<String> it = keys.iterator(); it.hasNext();) {
            String k = it.next();
            String v = fields.get(k);
            if (v != null && !v.isEmpty()) {
                hashData.append(k)
                        .append("=")
                        .append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
                if (it.hasNext()) hashData.append("&");
            }
        }

        String expected = VnPayConfig.hmacSHA512(
                VnPayConfig.secretKey,
                hashData.toString()
        );

        // chữ ký sai → coi như FAIL
        if (secureHash == null || !expected.equalsIgnoreCase(secureHash)) {
            response.sendRedirect(
                    "http://localhost:5173/payment/return"
                            + "?orderCode=" + URLEncoder.encode(orderCode, StandardCharsets.UTF_8)
                            + "&status=FAILED"
            );
            return;
        }

        // ===== 2️⃣ LẤY TRẠNG THÁI TỪ PARAM VNPAY =====
        String respCode = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");

        String status;

        if ("00".equals(respCode) && "00".equals(txnStatus)) {
            status = "SUCCESS";
            orderService.markPaid(orderCode);
        } else if ("24".equals(respCode)) {
            status = "CANCELLED";
            orderService.markPaymentCancelled(orderCode);
        } else {
            status = "FAILED";
            orderService.markPaymentFailed(orderCode);
        }

        // ===== 3️⃣ REDIRECT VỀ FE KÈM STATUS =====
        String feReturn =
                "http://localhost:5173/payment/return"
                        + "?orderCode=" + URLEncoder.encode(orderCode, StandardCharsets.UTF_8)
                        + "&status=" + status;

        response.sendRedirect(feReturn);
    }
//    @PostMapping("/vnpay/ipn")
//    public ResponseEntity<String> ipn(@RequestParam Map<String, String> params) {
//
//        // 1) verify chữ ký giống return (tách ra util càng tốt)
//        if (!VnPayVerifier.verify(params)) {
//            return ResponseEntity.badRequest().body("INVALID_SIGNATURE");
//        }
//
//        String orderCode = params.get("vnp_TxnRef");
//        String respCode  = params.get("vnp_ResponseCode"); // "00" là ok
//
//        // 2) verify amount (khuyến nghị)
//        // long amount = Long.parseLong(params.get("vnp_Amount")); // VNPay thường nhân 100
//        // orderService.verifyAmount(orderCode, amount);
//
//        if ("00".equals(respCode)) {
//            orderService.markPaid(orderCode);
//        } else if ("24".equals(respCode)) {
//            orderService.markPaymentCancelled(orderCode);
//        } else {
//            orderService.markPaymentFailed(orderCode);
//        }
//
//        return ResponseEntity.ok("OK");
//    }


}
