package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.Picture;
import org.example.be.business.product.model.entity.ProductSpecificationValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PictureRepository extends JpaRepository<Picture, UUID> {

    List<Picture> findByProductId(UUID productId);

    void deleteByProductId(UUID productId);
}
