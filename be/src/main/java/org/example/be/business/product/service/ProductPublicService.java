package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.*;
import org.example.be.business.product.model.entity.*;
import org.example.be.business.product.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductPublicService {

    private final ProductRepository productRepo;
    private final BrandRepository brandRepo;
    private final SpecificationAttributeRepository specAttrRepo;
    private final SpecificationValueRepository specValueRepo;
    private final ProductSpecificationValueRepository psvRepo;

    private final PictureRepository pictureRepo;
    private final ProductVariantRepository productVariantRepo;
    private final InventoryRepository inventoryItemRepo;
    private final ProductReviewRepository reviewRepo;
    private final CategoryRepository categoryRepo;

    @Transactional(readOnly = true)
    public HomeProductResponse getHomeProducts() {

        HomeProductResponse resp = new HomeProductResponse();

        resp.setDeepDiscountProducts(
                productRepo.findDeepDiscount(PageRequest.of(0, 8))
                        .stream()
                        .map(this::buildProductListItem)
                        .toList()
        );

        resp.setMostReviewedProducts(
                productRepo.findMostReviewed(PageRequest.of(0, 8))
                        .stream()
                        .map(this::buildProductListItem)
                        .toList()
        );

        resp.setHighestRatedProducts(
                productRepo.findHighestRated(PageRequest.of(0, 8))
                        .stream()
                        .map(this::buildProductListItem)
                        .toList()
        );

        resp.setBestSellingProducts(
                productRepo.findBestSelling(PageRequest.of(0, 8))
                        .stream()
                        .map(this::buildProductListItem)
                        .toList()
        );

        return resp;
    }

    // ================== PUBLIC API: /api/public/products/{category} ==================
    @Transactional(readOnly = true)
    public PagedProductListPublicResponse getProductsByCategory(
            String categorySlug,
            List<String> brandSlugs,
            List<UUID> specValueIds,
            int pageNum,
            int pageSize,
            String sort
    ) {

        // ===== Chuẩn hoá tham số =====
        if (pageNum < 1) {
            pageNum = 1;
        }
        if (pageSize <= 0) {
            pageSize = 12;
        }

        if (brandSlugs != null && brandSlugs.isEmpty()) {
            brandSlugs = null;
        }
        if (specValueIds != null && specValueIds.isEmpty()) {
            specValueIds = null;
        }

        // ===== Sort (hiện tại sort theo priceMin) =====
        Sort sortSpec = Sort.unsorted();
        if ("priceAsc".equalsIgnoreCase(sort)) {
            sortSpec = Sort.by(Sort.Direction.ASC, "priceMin");
        } else if ("priceDesc".equalsIgnoreCase(sort)) {
            sortSpec = Sort.by(Sort.Direction.DESC, "priceMin");
        }

        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, sortSpec);

        // ===== 1. Lấy Page<Product> theo category + brand + spec =====
        Page<Product> pageResult = productRepo.findPublishedByCategoryWithFilters(
                categorySlug,
                brandSlugs,
                specValueIds,
                pageable
        );

        List<Product> products = pageResult.getContent();

        // ===== 2. Build filter BRAND cho FE =====
        List<BrandListItemResponse> brandFilters = buildBrandFilter();

        // ===== 3. Build filter SPEC (attribute + list value text) =====
        List<SpecificationFilterDTO> specFilters = buildSpecificationFilter();

        // ===== 4. Map Product -> ProductListItemDTO =====
        List<ProductListItemDTO> productItems = products.stream()
                .map(this::buildProductListItem)
                .toList();
        List<PagedProductListPublicResponse.CategoryBreadcrumbDTO> breadcrumb =
                new ArrayList<>();

        Category category = categoryRepo.findBySlug(categorySlug);

        Category current = category;
        while (current != null) {
            breadcrumb.add(
                    new PagedProductListPublicResponse.CategoryBreadcrumbDTO(
                            current.getName(),
                            current.getSlug()
                    )
            );
            current = current.getParent();
        }
        Collections.reverse(breadcrumb);
        // ===== 5. Build response =====
        PagedProductListPublicResponse response = new PagedProductListPublicResponse();
        response.setProducts(productItems);
        response.setBrands(brandFilters);
        response.setSpecifications(specFilters);
        response.setBreadcrumb(breadcrumb);
        response.setPageNum(pageNum);
        response.setPageSize(pageSize);
        response.setTotalElements(pageResult.getTotalElements());
        response.setTotalPages(pageResult.getTotalPages());

        return response;
    }

    // ================== HÀM PHỤ ==================

    private List<BrandListItemResponse> buildBrandFilter() {
        return brandRepo.findAll().stream()
                .map(b -> {
                    BrandListItemResponse dto = new BrandListItemResponse();
                    dto.setId(b.getId());
                    dto.setName(b.getName());
                    dto.setSlug(b.getSlug());
                    dto.setImage(b.getImage());
                    return dto;
                })
                .toList();
    }

    private List<SpecificationFilterDTO> buildSpecificationFilter() {
        return specAttrRepo.findAll().stream()
                .map(attr -> {
                    List<String> values = specValueRepo.findByAttributeId(attr.getId())
                            .stream()
                            .map(SpecificationValue::getValueText)
                            .distinct()
                            .sorted()
                            .toList();

                    SpecificationFilterDTO dto = new SpecificationFilterDTO();
                    dto.setAttribute(attr.getName());
                    dto.setValues(values);
                    return dto;
                })
                .toList();
    }

    private ProductListItemDTO buildProductListItem(Product p) {

        // Lấy tất cả spec-value của product
        List<ProductSpecificationValue> psvList =
                psvRepo.findByProduct_Id(p.getId());

        Map<String, List<String>> specMap = new HashMap<>();

        psvList.forEach(psv -> {
            SpecificationValue sv = psv.getSpecificationValue();
            String attrName = sv.getAttribute().getName();
            String valueText = sv.getValueText();

            specMap
                    .computeIfAbsent(attrName, k -> new ArrayList<>())
                    .add(valueText);
        });

        ProductListItemDTO dto = new ProductListItemDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlug(p.getSlug());
        dto.setThumbnailUrl(p.getThumbnailUrl());
        dto.setPriceMin(p.getPriceMin());
        dto.setSalePriceMin(p.getSalePriceMin());
        dto.setTotalReviews(p.getTotalReviews());
        dto.setAverageRating(p.getAverageRating());

        // brand
        BrandListItemResponse brandDto = new BrandListItemResponse();
        brandDto.setId(p.getBrand().getId());
        brandDto.setName(p.getBrand().getName());
        brandDto.setSlug(p.getBrand().getSlug());
        brandDto.setImage(p.getBrand().getImage());
        dto.setBrand(brandDto);

        dto.setSpecifications(specMap);

        return dto;
    }

    @Transactional(readOnly = true)
    public ProductDetailPublicRespDTO getDetail(UUID id) {

        // ===== 1. Lấy Product =====
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // ===== 2. Build DTO chính =====
        ProductDetailPublicRespDTO dto = new ProductDetailPublicRespDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setSlug(product.getSlug());
        dto.setDescription(product.getDescription());
        dto.setShortDescription(product.getShortDescription());
        dto.setPriceMin(product.getPriceMin());
        dto.setSalePriceMin(product.getSalePriceMin());

        // ===== 3. Brand =====
        BrandListItemResponse brandDTO = new BrandListItemResponse();
        brandDTO.setId(product.getBrand().getId());
        brandDTO.setName(product.getBrand().getName());
        brandDTO.setSlug(product.getBrand().getSlug());
        brandDTO.setImage(product.getBrand().getImage());
        dto.setBrand(brandDTO);

        // ===== 4. Images (từ bảng Picture) =====
        List<ImagePublicRespDTO> imageDTOs = pictureRepo.findByProductId(product.getId())
                .stream()
                .map(pic -> new ImagePublicRespDTO(pic.getUrl()))
                .toList();
        dto.setImages(imageDTOs);

        // ===== 5. Variants =====
        List<VariantPublicRespDTO> variants = productVariantRepo.findByProductId(product.getId())
                .stream()
                .map(v -> {
                    VariantPublicRespDTO vv = new VariantPublicRespDTO();
                    vv.setId(v.getId());
                    vv.setName(v.getName());
                    vv.setSku(v.getSku());
                    vv.setPrice(v.getPrice());
                    vv.setDiscountPrice(v.getDiscountPrice());

                    InventoryItem inv = inventoryItemRepo.findByVariantId(v.getId()).orElse(null);
                    vv.setStock(inv != null ? inv.getStockOnHand() : 0);

                    return vv;
                })
                .toList();
        dto.setVariants(variants);

        // ===== 6. Specifications =====
        Map<String, List<String>> specMap =
                psvRepo.findByProduct_Id(product.getId())
                        .stream()
                        .collect(Collectors.groupingBy(
                                psv -> psv.getSpecificationValue().getAttribute().getName(),
                                Collectors.mapping(
                                        psv -> psv.getSpecificationValue().getValueText(),
                                        Collectors.toList()
                                )
                        ));
        dto.setSpecifications(specMap);

        // ===== 7. Reviews + JOIN User =====
        List<ReviewPublicRespDTO> reviewDTOs =
                reviewRepo.findReviewsWithUser(product.getId()).stream().map(r -> {
                    ReviewPublicRespDTO rv = new ReviewPublicRespDTO();
                    rv.setId(r.getId());
                    rv.setRating(r.getRating());
                    rv.setComment(r.getComment());
                    rv.setCreatedAt(r.getCreatedAt());

                    String email = r.getUserEmail();
                    String displayName = (email != null) ? email.split("@")[0] : "User";
                    rv.setUserName(displayName);

                    return rv;
                }).toList();

        dto.setReviews(reviewDTOs);
        dto.setTotalReviews(reviewDTOs.size());

        double avg = reviewDTOs.isEmpty()
                ? 0
                : reviewDTOs.stream().mapToInt(ReviewPublicRespDTO::getRating).average().orElse(0);
        dto.setAverageRating(avg);

        return dto;
    }
    @Transactional(readOnly = true)
    public PagedProductListPublicResponse search(
            String keyword,
            int pageNum,
            int pageSize
    ) {
        if (pageNum < 1) pageNum = 1;
        if (pageSize <= 0) pageSize = 12;

        Pageable pageable = PageRequest.of(
                pageNum - 1,
                pageSize,
                Sort.by(Sort.Direction.DESC, "updatedAt")
        );

        Page<Product> page = productRepo.searchPublic(
                keyword.trim().toLowerCase(),
                pageable
        );

        // ===== map Product -> ProductListItemDTO =====
        List<ProductListItemDTO> products = page.getContent()
                .stream()
                .map(p -> {
                    ProductListItemDTO dto = new ProductListItemDTO();
                    dto.setId(p.getId());
                    dto.setName(p.getName());
                    dto.setSlug(p.getSlug());
                    dto.setThumbnailUrl(p.getThumbnailUrl());
                    dto.setPriceMin(p.getPriceMin());
                    dto.setSalePriceMin(p.getSalePriceMin());
                    dto.setAverageRating(p.getAverageRating());
                    dto.setTotalReviews(p.getTotalReviews());

                    // brand (nhẹ, FE search cần)
                    BrandListItemResponse brand = new BrandListItemResponse();
                    brand.setId(p.getBrand().getId());
                    brand.setName(p.getBrand().getName());
                    brand.setSlug(p.getBrand().getSlug());
                    brand.setImage(p.getBrand().getImage());
                    dto.setBrand(brand);

                    return dto;
                })
                .toList();

        // ===== build response =====
        PagedProductListPublicResponse resp = new PagedProductListPublicResponse();
        resp.setProducts(products);

        // search KHÔNG cần filter
        resp.setBrands(List.of());
        resp.setSpecifications(List.of());

        resp.setPageNum(pageNum);
        resp.setPageSize(pageSize);
        resp.setTotalElements(page.getTotalElements());
        resp.setTotalPages(page.getTotalPages());

        return resp;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProductsForChatbot() {

        List<Product> products = productRepo.findAllPublished();
        // nếu chưa soft delete thì findAll()

        return products.stream().map(p -> {

            Map<String, Object> product = new LinkedHashMap<>();

            // ===== Basic =====
            product.put("id", p.getId());
            product.put("name", p.getName());
            product.put("brand", p.getBrand().getName());
            product.put("slug", p.getSlug());
            product.put("thumbnailUrl", p.getThumbnailUrl());
            product.put("priceMin", p.getPriceMin());
            product.put("salePriceMin", p.getSalePriceMin());

            // ===== Categories =====
            List<String> categories =
                    p.getProductCategories()
                            .stream()
                            .map(pc -> pc.getCategory().getName())
                            .toList();

            product.put("categories", categories);

            // ===== Variants + Stock =====
            List<Map<String, Object>> variants =
                    productVariantRepo.findByProductId(p.getId())
                            .stream()
                            .map(v -> {
                                Map<String, Object> variant = new LinkedHashMap<>();
                                variant.put("sku", v.getSku());
                                variant.put("price", v.getPrice());
                                variant.put("discountPrice", v.getDiscountPrice());

                                InventoryItem inv =
                                        inventoryItemRepo.findByVariantId(v.getId()).orElse(null);
                                variant.put("stock", inv != null ? inv.getStockOnHand() : 0);

                                return variant;
                            })
                            .toList();

            product.put("variants", variants);

            // ===== Specifications (CORE CHATBOT) =====
            Map<String, List<String>> specifications =
                    psvRepo.findByProduct_Id(p.getId())
                            .stream()
                            .collect(Collectors.groupingBy(
                                    psv -> psv.getSpecificationValue()
                                            .getAttribute()
                                            .getName(),
                                    Collectors.mapping(
                                            psv -> psv.getSpecificationValue().getValueText(),
                                            Collectors.toList()
                                    )
                            ));

            product.put("specifications", specifications);

            return product;

        }).toList();
    }

}
