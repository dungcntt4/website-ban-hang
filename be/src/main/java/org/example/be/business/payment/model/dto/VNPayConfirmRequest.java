package org.example.be.business.payment.model.dto;

import lombok.Data;

import java.util.Map;

@Data
public class VNPayConfirmRequest {
    /**
     * Map toàn bộ params VNPay redirect về (vnp_Amount, vnp_ResponseCode, vnp_SecureHash...)
     * FE lấy từ window.location.search và gửi lại.
     */
    private Map<String, String> params;
}
