package org.example.be.business.payment.service;
import org.example.be.business.payment.model.dto.VnPayConfig;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public final class VnPayVerifier {

    private VnPayVerifier() {}

    public static boolean verify(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isEmpty()) {
            return false;
        }

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
                if (it.hasNext()) {
                    hashData.append("&");
                }
            }
        }

        String expected = VnPayConfig.hmacSHA512(
                VnPayConfig.secretKey,
                hashData.toString()
        );

        return expected.equalsIgnoreCase(secureHash);
    }
}
