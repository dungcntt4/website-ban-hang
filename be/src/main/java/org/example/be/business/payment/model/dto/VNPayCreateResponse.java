package org.example.be.business.payment.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VNPayCreateResponse {
    private String code;     // "00" success
    private String message;
    private String data;     // paymentUrl
}