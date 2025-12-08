package org.example.be.business.product.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.ProductCreateRequest;
import org.example.be.business.product.model.dto.ProductDetailResponse;
import org.example.be.business.product.model.dto.ProductListItemResponse;
import org.example.be.business.product.model.entity.*;
import org.example.be.business.product.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepo;
    private final PictureRepository pictureRepo;
    private final ProductVariantRepository variantRepo;
    // ❌ BỎ InventoryRepository: tồn kho sẽ do luồng Phiếu nhập xử lý
    // private final InventoryRepository inventoryRepo;
    private final SpecificationValueRepository specValueRepo;
    private final ProductSpecificationValueRepository productSpecRepo;
    private final BrandRepository brandRepo;
    private final CategoryRepository categoryRepo;
    private final ProductCategoryRepository productCategoryRepo;
    private final ProductVariantOptionValueRepository variantOptionValueRepo;
    private final ProductOptionValueRepository optionValueRepo;

    @Transactional
    public UUID create(ProductCreateRequest req) {

        // ===== 1. Tạo product =====
        Product p = new Product();
        p.setCode(req.getProduct().getCode());
        p.setName(req.getProduct().getName());
        p.setSlug(req.getProduct().getSlug());
        p.setPublished(req.getProduct().isPublished());
        p.setShortDescription(req.getProduct().getShort_description());
        p.setDescription(req.getProduct().getDescription());
        p.setThumbnailUrl(req.getProduct().getThumbnail_url());

        // brand
        Brand brand = brandRepo.findById(req.getProduct().getBrand_id())
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        p.setBrand(brand);

        productRepo.save(p);

        // ===== 2. Lưu product_category từ danh sách category UUID =====
        List<UUID> categoryIds = Optional.ofNullable(req.getProduct().getCategories())
                .orElse(Collections.emptyList());

        if (!categoryIds.isEmpty()) {
            // lấy hết category theo id
            List<Category> categories = categoryRepo.findAllById(categoryIds);
            Map<UUID, Category> catMap = categories.stream()
                    .collect(Collectors.toMap(Category::getId, c -> c));

            // check xem có id nào không tồn tại không
            for (UUID catId : categoryIds) {
                Category cat = catMap.get(catId);
                if (cat == null) {
                    throw new RuntimeException("Category not found: " + catId);
                }

                ProductCategory pc = new ProductCategory();
                pc.setProduct(p);
                pc.setCategory(cat);
                productCategoryRepo.save(pc);
            }
        }

        // ===== 3. Lưu ảnh =====
        for (var pic : req.getPictures()) {
            Picture img = new Picture();
            img.setProduct(p);
            img.setUrl(pic.getUrl());
            img.setAltText(pic.getAlt_text());
            pictureRepo.save(img);
        }

        // ===== 4. Lưu specification =====
        for (var s : req.getSpecifications()) {
            SpecificationValue value = specValueRepo.findById(s.getSpecification_value_id())
                    .orElseThrow();
            ProductSpecificationValue link = new ProductSpecificationValue();
            link.setProduct(p);
            link.setSpecificationValue(value);
            productSpecRepo.save(link);
        }

        // ===== 5. Lưu variants & tính priceMin / salePriceMin =====
        BigDecimal bestEffectivePrice = null;  // giá hiệu dụng nhỏ nhất (discount hoặc price)
        BigDecimal displayBasePrice   = null;  // giá gốc hiển thị
        BigDecimal displaySalePrice   = null;  // giá sale hiển thị

        for (var v : req.getVariants()) {
            ProductVariant pv = new ProductVariant();
            pv.setProduct(p);
            pv.setSku(v.getSku());
            pv.setName(v.getName());
            // ❌ KHÔNG còn costPrice
            // pv.setCostPrice(v.getCost_price());
            pv.setDiscountPrice(v.getDiscount_price());
            pv.setPrice(v.getPrice());
            pv.setActive(v.isActive());
            variantRepo.save(pv);

            // ❌ KHÔNG tạo InventoryItem ở đây nữa
            // Thay vào đó, tồn kho sẽ do luồng Phiếu nhập (purchase_receipt) xử lý

            // Lưu mapping option cho variant
            if (v.getOptions() != null) {
                for (var optDto : v.getOptions()) {
                    ProductOptionValue optionValue = optionValueRepo.findById(optDto.getOption_value_id())
                            .orElseThrow(() -> new RuntimeException("Option value not found: " + optDto.getOption_value_id()));

                    ProductOption option = optionValue.getOption();

                    ProductVariantOptionValue vov = new ProductVariantOptionValue();
                    vov.setVariant(pv);
                    vov.setOption(option);
                    vov.setOptionValue(optionValue);

                    variantOptionValueRepo.save(vov);
                }
            }

            // tính giá hiệu dụng
            BigDecimal price = v.getPrice();
            BigDecimal discountPrice = v.getDiscount_price();
            BigDecimal effectivePrice = (discountPrice != null ? discountPrice : price);

            if (effectivePrice != null) {
                if (bestEffectivePrice == null || effectivePrice.compareTo(bestEffectivePrice) < 0) {
                    bestEffectivePrice = effectivePrice;
                    displayBasePrice   = price;
                    displaySalePrice   = discountPrice;
                }
            }
        }

        // gán giá của variant rẻ nhất vào product
        p.setPriceMin(displayBasePrice);
        p.setSalePriceMin(displaySalePrice);

        return p.getId();
    }

    @Transactional(readOnly = true)
    public List<ProductListItemResponse> getAdminProducts() {
        List<Product> products = productRepo.findByDeletedFalse();

        if (products.isEmpty()) {
            return Collections.emptyList();
        }

        // ===== 1) map productId -> variants =====
        Map<UUID, List<ProductVariant>> variantMap = variantRepo.findAll().stream()
                .collect(Collectors.groupingBy(v -> v.getProduct().getId()));

        // ❌ Bỏ inventoryMap: tồn kho sẽ tính từ bảng lô sau (purchase_receipt_item)
        // Map<UUID, List<InventoryItem>> inventoryMap = inventoryRepo.findAll().stream()
        //         .collect(Collectors.groupingBy(i -> i.getVariant().getId()));

        // ===== 2) map productId -> category names =====
        Set<UUID> productIds = products.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());

        Map<UUID, List<String>> categoryNameMap = productCategoryRepo.findByProductIdIn(productIds).stream()
                .collect(Collectors.groupingBy(
                        pc -> pc.getProduct().getId(),
                        Collectors.mapping(
                                pc -> pc.getCategory().getName(),
                                Collectors.toList()
                        )
                ));

        List<ProductListItemResponse> result = new ArrayList<>();

        for (Product p : products) {
            List<ProductVariant> variants = variantMap.getOrDefault(p.getId(), Collections.emptyList());
            long skuCount = variants.size();

            // ❌ Tạm thời không tính tổng tồn kho ở đây (sẽ dùng bảng lô sau này)
            long totalStockOnHand = 0L;

            // danh sách tên category (distinct)
            List<String> categoryNames = categoryNameMap.getOrDefault(p.getId(), Collections.emptyList())
                    .stream()
                    .distinct()
                    .toList();

            ProductListItemResponse dto = ProductListItemResponse.builder()
                    .id(p.getId())
                    .code(p.getCode())
                    .name(p.getName())
                    .slug(p.getSlug())
                    .thumbnailUrl(p.getThumbnailUrl())
                    .published(p.isPublished())
                    .priceMin(p.getPriceMin())
                    .salePriceMin(p.getSalePriceMin())
                    .totalSold(p.getTotalSold())
                    .totalReviews(p.getTotalReviews())
                    .averageRating(p.getAverageRating())
                    .brandName(p.getBrand() != null ? p.getBrand().getName() : null)
                    .categories(categoryNames)
                    .stockOnHand(totalStockOnHand)   // hiện set 0, sau có bảng lô sẽ tính lại
                    .skuCount(skuCount)
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .build();
            result.add(dto);
        }

        // sort mới nhất lên đầu
        result.sort(Comparator.comparing(ProductListItemResponse::getUpdatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed());

        return result;
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getDetail(UUID id) {
        Product p = productRepo.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        // ===== product DTO =====
        ProductDetailResponse.ProductInfo productDTO = new ProductDetailResponse.ProductInfo();
        productDTO.setCode(p.getCode());
        productDTO.setName(p.getName());
        productDTO.setSlug(p.getSlug());
        productDTO.setPublished(p.isPublished());
        productDTO.setShortDescription(p.getShortDescription());
        productDTO.setDescription(p.getDescription());
        productDTO.setThumbnailUrl(p.getThumbnailUrl());
        productDTO.setBrandId(
                p.getBrand() != null ? p.getBrand().getId() : null
        );

        // categories
        List<ProductCategory> pcs = productCategoryRepo.findByProductId(p.getId());
        List<UUID> categoryIds = pcs.stream()
                .map(pc -> pc.getCategory().getId())
                .toList();
        productDTO.setCategories(categoryIds);

        // ===== pictures =====
        List<Picture> pictures = pictureRepo.findByProductId(p.getId());
        List<ProductDetailResponse.PictureInfo> pictureDTOs = pictures.stream().map(pic -> {
            ProductDetailResponse.PictureInfo dto = new ProductDetailResponse.PictureInfo();
            dto.setUrl(pic.getUrl());
            dto.setAltText(pic.getAltText());
            return dto;
        }).toList();

        // ===== specifications =====
        List<ProductSpecificationValue> specLinks =
                productSpecRepo.findByProductId(p.getId());

        List<ProductDetailResponse.SpecificationInfo> specDTOs = specLinks.stream()
                .map(link -> {
                    SpecificationValue sv = link.getSpecificationValue();   // VD: "Ryzen 7"
                    SpecificationAttribute sa = sv.getAttribute();          // VD: "CPU"

                    ProductDetailResponse.SpecificationInfo dto =
                            new ProductDetailResponse.SpecificationInfo();

                    dto.setSpecificationValueId(sv.getId());
                    dto.setSpecificationAttributeId(sa.getId());
                    dto.setSpecificationAttributeName(sa.getName());

                    return dto;
                })
                .toList();


        // ===== variants + options =====
        List<ProductVariant> variants = variantRepo.findByProductId(p.getId());
        List<UUID> variantIds = variants.stream().map(ProductVariant::getId).toList();

        List<ProductVariantOptionValue> variantOpts =
                variantIds.isEmpty()
                        ? List.of()
                        : variantOptionValueRepo.findByVariantIdIn(variantIds);

        Map<UUID, List<ProductVariantOptionValue>> optsByVariant = variantOpts.stream()
                .collect(Collectors.groupingBy(vov -> vov.getVariant().getId()));

        List<ProductDetailResponse.VariantInfo> variantDTOs = new ArrayList<>();

        for (ProductVariant v : variants) {
            ProductDetailResponse.VariantInfo dto = new ProductDetailResponse.VariantInfo();
            dto.setSku(v.getSku());
            dto.setName(v.getName());
            // ❌ Không còn costPrice trên variant
            // dto.setCostPrice(v.getCostPrice());
            dto.setDiscountPrice(v.getDiscountPrice());
            dto.setPrice(v.getPrice());
            dto.setActive(v.isActive());

            List<ProductVariantOptionValue> vOpts = optsByVariant.getOrDefault(v.getId(), List.of());
            List<ProductDetailResponse.VariantOptionInfo> optDTOs = vOpts.stream()
                    .map(vov -> {
                        ProductDetailResponse.VariantOptionInfo oDto = new ProductDetailResponse.VariantOptionInfo();
                        oDto.setOptionId(vov.getOption().getId());
                        oDto.setOptionValueId(vov.getOptionValue().getId());
                        oDto.setOptionName(vov.getOption().getName());
                        oDto.setOptionValueLabel(vov.getOptionValue().getValue());
                        return oDto;
                    })
                    .toList();

            dto.setOptions(optDTOs);

            variantDTOs.add(dto);
        }

        // ===== inventory =====
        // ❌ Bỏ logic inventory trong detail – màn ProductCreate phía FE không còn dùng inventory nữa.
        // Nếu sau này cần hiển thị tồn kho theo lô, sẽ viết service riêng đọc từ purchase_receipt_item.

        ProductDetailResponse resp = new ProductDetailResponse();
        resp.setId(p.getId());
        resp.setProduct(productDTO);
        resp.setPictures(pictureDTOs);
        resp.setSpecifications(specDTOs);
        resp.setVariants(variantDTOs);
        // resp.setInventory(...);  // ❌ bỏ

        return resp;
    }

    @Transactional
    public void update(UUID id, ProductCreateRequest req) {

        Product p = productRepo.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        // ===== 1. update basic fields =====
        p.setCode(req.getProduct().getCode());
        p.setName(req.getProduct().getName());
        p.setSlug(req.getProduct().getSlug());
        p.setPublished(req.getProduct().isPublished());
        p.setShortDescription(req.getProduct().getShort_description());
        p.setDescription(req.getProduct().getDescription());
        p.setThumbnailUrl(req.getProduct().getThumbnail_url());

        Brand brand = brandRepo.findById(req.getProduct().getBrand_id())
                .orElseThrow(() -> new RuntimeException("Brand not found: " + req.getProduct().getBrand_id()));
        p.setBrand(brand);

        productRepo.save(p);

        // ===== 2. update categories (xoá hết, tạo lại) =====
        productCategoryRepo.deleteByProductId(p.getId());

        List<UUID> categoryIds = Optional.ofNullable(req.getProduct().getCategories())
                .orElse(Collections.emptyList());

        if (!categoryIds.isEmpty()) {
            List<Category> categories = categoryRepo.findAllById(categoryIds);
            Map<UUID, Category> catMap = categories.stream()
                    .collect(Collectors.toMap(Category::getId, c -> c));

            for (UUID catId : categoryIds) {
                Category cat = catMap.get(catId);
                if (cat == null) {
                    throw new RuntimeException("Category not found: " + catId);
                }
                ProductCategory pc = new ProductCategory();
                pc.setProduct(p);
                pc.setCategory(cat);
                productCategoryRepo.save(pc);
            }
        }

        // ===== 3. pictures: clear & recreate =====
        pictureRepo.deleteByProductId(p.getId());
        for (var pic : req.getPictures()) {
            Picture img = new Picture();
            img.setProduct(p);
            img.setUrl(pic.getUrl());
            img.setAltText(pic.getAlt_text());
            pictureRepo.save(img);
        }

        // ===== 4. specifications: clear & recreate =====
        productSpecRepo.deleteByProductId(p.getId());
        for (var s : req.getSpecifications()) {
            SpecificationValue value = specValueRepo.findById(s.getSpecification_value_id())
                    .orElseThrow(() -> new RuntimeException("Spec value not found: " + s.getSpecification_value_id()));
            ProductSpecificationValue link = new ProductSpecificationValue();
            link.setProduct(p);
            link.setSpecificationValue(value);
            productSpecRepo.save(link);
        }

        // ===== 5. load variants hiện có =====
        List<ProductVariant> oldVariants = variantRepo.findByProductId(p.getId());
        Map<String, ProductVariant> variantMapBySku = oldVariants.stream()
                .collect(Collectors.toMap(ProductVariant::getSku, v -> v));

        List<UUID> oldVariantIds = oldVariants.stream()
                .map(ProductVariant::getId)
                .toList();

        // ===== 5.1. load toàn bộ option hiện có của các variant này (để không insert trùng) =====
        List<ProductVariantOptionValue> existingVovs =
                oldVariantIds.isEmpty()
                        ? List.of()
                        : variantOptionValueRepo.findByVariantIdIn(oldVariantIds);

        // key: variantId:optionId:optionValueId
        Set<String> existingOptionKeys = existingVovs.stream()
                .map(vov -> vov.getVariant().getId()
                        + ":" + vov.getOption().getId()
                        + ":" + vov.getOptionValue().getId())
                .collect(Collectors.toSet());

        // ❌ Bỏ toàn bộ inventory hiện có: tồn kho không update ở đây nữa
        // List<InventoryItem> existingInventories = inventoryRepo.findByVariantProductId(p.getId());
        // Map<UUID, InventoryItem> invByVariantId = existingInventories.stream() ...

        // ===== 6. update / create variants & recompute priceMin/salePriceMin =====
        BigDecimal bestEffectivePrice = null;
        BigDecimal displayBasePrice   = null;
        BigDecimal displaySalePrice   = null;

        // ❌ Bỏ map inventory trong request theo SKU
        // Map<String, ProductCreateRequest.InventoryDTO> invMap = ...

        for (var v : req.getVariants()) {

            // ----- 6.1. tìm hoặc tạo variant theo SKU -----
            ProductVariant pv = variantMapBySku.get(v.getSku());
            if (pv == null) {
                pv = new ProductVariant();
                pv.setProduct(p);
                pv.setSku(v.getSku()); // SKU mới
                variantMapBySku.put(v.getSku(), pv);
            }

            pv.setName(v.getName());
            // ❌ Bỏ costPrice
            // pv.setCostPrice(v.getCost_price());
            pv.setDiscountPrice(v.getDiscount_price());
            pv.setPrice(v.getPrice());
            pv.setActive(v.isActive());

            variantRepo.save(pv);

            // ----- 6.2. BỎ INVENTORY: không cộng thêm tồn kho ở ProductService -----
            // tồn kho sẽ được cập nhật qua luồng Phiếu nhập (purchase_receipt)

            // ----- 6.3. OPTIONS: chỉ thêm cái mới, không xoá option cũ, không insert trùng -----
            if (v.getOptions() != null && !v.getOptions().isEmpty()) {

                for (var optDto : v.getOptions()) {
                    ProductOptionValue optionValue = optionValueRepo.findById(optDto.getOption_value_id())
                            .orElseThrow(() ->
                                    new RuntimeException("Option value not found: " + optDto.getOption_value_id()));

                    ProductOption option = optionValue.getOption();

                    String key = pv.getId() + ":" + option.getId() + ":" + optionValue.getId();

                    // nếu mapping này đã tồn tại trong DB rồi => bỏ qua
                    if (existingOptionKeys.contains(key)) {
                        continue;
                    }

                    ProductVariantOptionValue vov = new ProductVariantOptionValue();
                    vov.setVariant(pv);
                    vov.setOption(option);
                    vov.setOptionValue(optionValue);

                    variantOptionValueRepo.save(vov);
                    existingOptionKeys.add(key);
                }
            }

            // ----- 6.4. tính giá hiệu dụng -----
            BigDecimal price = v.getPrice();
            BigDecimal discountPrice = v.getDiscount_price();
            BigDecimal effectivePrice = (discountPrice != null ? discountPrice : price);

            if (effectivePrice != null) {
                if (bestEffectivePrice == null || effectivePrice.compareTo(bestEffectivePrice) < 0) {
                    bestEffectivePrice = effectivePrice;
                    displayBasePrice   = price;
                    displaySalePrice   = discountPrice;
                }
            }
        }

        // ===== 7. cập nhật priceMin / salePriceMin của product =====
        p.setPriceMin(displayBasePrice);
        p.setSalePriceMin(displaySalePrice);
        productRepo.save(p);
    }

    @Transactional
    public void delete(UUID id) {
        // chỉ xoá soft nếu chưa xoá
        Product p = productRepo.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Product not found or already deleted: " + id));

        // đánh dấu xoá và unpublish
        p.setDeleted(true);
        p.setPublished(false);

        // có thể tắt luôn các variant để tránh bán nhầm
        List<ProductVariant> variants = variantRepo.findByProductId(p.getId());
        for (ProductVariant v : variants) {
            v.setActive(false);
        }

        productRepo.save(p);
    }
}
