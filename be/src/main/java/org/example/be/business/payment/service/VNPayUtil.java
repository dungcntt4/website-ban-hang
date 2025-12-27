package org.example.be.business.payment.service;

import org.apache.commons.codec.digest.HmacUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;

public class VNPayUtil {

    public static String hmacSHA512(String key, String data) {
        return HmacUtils.hmacSha512Hex(key, data);
    }

    public static String getCurrentTime() {
        return new SimpleDateFormat("yyyyMMddHHmmss")
                .format(new Date());
    }

    public static String getExpireTime(int minutes) {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, minutes);
        return new SimpleDateFormat("yyyyMMddHHmmss")
                .format(cal.getTime());
    }

    public static String buildQueryString(Map<String, String> params) {
        StringBuilder query = new StringBuilder();
        params.forEach((k, v) -> {
            if (query.length() > 0) query.append("&");
            query.append(URLEncoder.encode(k, StandardCharsets.UTF_8))
                    .append("=")
                    .append(URLEncoder.encode(v, StandardCharsets.UTF_8));
        });
        return query.toString();
    }
}