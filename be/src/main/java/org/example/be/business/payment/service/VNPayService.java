package org.example.be.business.payment.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.business.payment.model.dto.VNPayCreateRequest;
import org.example.be.business.payment.model.dto.VNPayCreateResponse;
import org.example.be.business.payment.model.dto.VnPayConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VNPayService {

    public Map<String, Object> createPaymentLikeCreateQr(
            VNPayCreateRequest req,
            HttpServletRequest request
    ) throws Exception {

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TmnCode = VnPayConfig.vnp_TmnCode;

        // 🔴 QUAN TRỌNG: giống create-qr
        String vnp_TxnRef = req.getOrderCode();

        String vnp_IpAddr = VnPayConfig.getIpAddress(request);

        String orderType = req.getOrderType() != null
                ? req.getOrderType()
                : "other";

        long vnpAmount = req.getAmount().longValue() * 100;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(vnpAmount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", req.getOrderInfo());
        vnp_Params.put("vnp_OrderType", orderType);
        vnp_Params.put("vnp_Locale",
                req.getLanguage() != null ? req.getLanguage() : "vn");
        vnp_Params.put("vnp_ReturnUrl", VnPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", sdf.format(cld.getTime()));

        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", sdf.format(cld.getTime()));

        // ===== SORT PARAMS =====
        List<String> keys = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(keys);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Iterator<String> it = keys.iterator(); it.hasNext(); ) {
            String k = it.next();
            String v = vnp_Params.get(k);
            if (v != null && !v.isEmpty()) {

                // 🔴 GIỮ Y HỆT create-qr
                hashData.append(k).append("=")
                        .append(URLEncoder.encode(v, StandardCharsets.US_ASCII));

                query.append(URLEncoder.encode(k, StandardCharsets.US_ASCII))
                        .append("=")
                        .append(URLEncoder.encode(v, StandardCharsets.US_ASCII));

                if (it.hasNext()) {
                    hashData.append("&");
                    query.append("&");
                }
            }
        }

        String secureHash = VnPayConfig.hmacSHA512(
                VnPayConfig.secretKey,
                hashData.toString()
        );

        String paymentUrl =
                VnPayConfig.vnp_PayUrl
                        + "?"
                        + query
                        + "&vnp_SecureHash="
                        + secureHash;

        // ===== RESPONSE GIỮ NGUYÊN =====
        Map<String, Object> res = new HashMap<>();
        res.put("code", "00");
        res.put("paymentUrl", paymentUrl);
        res.put("txnRef", vnp_TxnRef);

        return res;
    }
}
