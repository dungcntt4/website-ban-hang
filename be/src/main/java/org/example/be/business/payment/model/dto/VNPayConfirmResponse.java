package org.example.be.business.payment.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VNPayConfirmResponse {
    private boolean validSignature;
    private String responseCode;   // "00" success
    private String orderCode;      // ORD-...
    private String orderStatus;    // DA_THANH_TOAN / THAT_BAI
}
