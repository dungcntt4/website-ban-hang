package org.example.be.business.product.model.dto;

import lombok.Data;

@Data
public class ImagePublicRespDTO {

    private String url;

    public ImagePublicRespDTO(String url) {
        this.url = url;
    }

    public ImagePublicRespDTO() {}
}
