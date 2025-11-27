package org.example.be.business.product.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class CloudinaryService {
    private final Cloudinary cloudinary;
    public CloudinaryService(Cloudinary cloudinary) { this.cloudinary = cloudinary; }

    public UploadResult uploadImage(MultipartFile file, String folder) {
        try {
            Map<String, Object> res = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "overwrite", true
                    )
            );

            Object bytesObj = res.get("bytes");
            long size = (bytesObj instanceof Number) ? ((Number) bytesObj).longValue() : 0L;

            return new UploadResult(
                    (String) res.get("secure_url"),
                    (String) res.get("public_id"),
                    size
            );

        } catch (Exception e) {
            throw new RuntimeException("Upload Cloudinary thất bại: " + e.getMessage(), e);
        }
    }

    public record UploadResult(String url, String publicId, long size) {}
}
