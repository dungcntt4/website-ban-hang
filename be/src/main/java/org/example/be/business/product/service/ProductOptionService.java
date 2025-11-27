package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.ProductOptionDetailResponse;
import org.example.be.business.product.model.dto.ProductOptionListItemResponse;
import org.example.be.business.product.model.dto.ProductOptionRequest;
import org.example.be.business.product.model.entity.ProductOption;
import org.example.be.business.product.model.entity.ProductOptionValue;
import org.example.be.business.product.model.entity.ProductVariantOptionValue;
import org.example.be.business.product.repository.ProductOptionRepository;
import org.example.be.business.product.repository.ProductOptionValueRepository;
import org.example.be.business.product.repository.ProductVariantOptionValueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductOptionService {

    private final ProductOptionRepository optionRepo;
    private final ProductOptionValueRepository valueRepo;
    private final ProductVariantOptionValueRepository variantOptionValueRepo;

    /* ========== CREATE ========== */
    public UUID create(ProductOptionRequest req) {
        if (req.getOption() == null || req.getOption().getName() == null
                || req.getOption().getName().trim().isEmpty()) {
            throw new RuntimeException("Tên option là bắt buộc");
        }

        String name = req.getOption().getName().trim();
        if (optionRepo.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Option đã tồn tại: " + name);
        }

        List<String> cleanedValues = normalizeValues(req.getValues());
        if (cleanedValues.isEmpty()) {
            throw new RuntimeException("Cần ít nhất 1 giá trị cho option.");
        }

        ProductOption opt = new ProductOption();
        opt.setName(name);
        optionRepo.save(opt);

        for (String v : cleanedValues) {
            ProductOptionValue pov = new ProductOptionValue();
            pov.setOption(opt);
            pov.setValue(v);
            valueRepo.save(pov);
        }

        return opt.getId();
    }

    private List<String> normalizeValues(List<ProductOptionRequest.OptionValueDTO> list) {
        if (list == null) return List.of();
        Set<String> seen = new HashSet<>();
        List<String> result = new ArrayList<>();
        for (ProductOptionRequest.OptionValueDTO dto : list) {
            String t = dto.getValue() != null ? dto.getValue().trim() : "";
            if (t.isEmpty()) continue;
            String key = t.toLowerCase();
            if (seen.contains(key)) continue;
            seen.add(key);
            result.add(t);
        }
        return result;
    }

    /* ========== LIST ========== */
    @Transactional(readOnly = true)
    public List<ProductOptionListItemResponse> listAll() {
        List<ProductOption> options = optionRepo.findAll();
        if (options.isEmpty()) return List.of();

        List<UUID> optionIds = options.stream().map(ProductOption::getId).toList();

        // lấy tất cả value của các option
        List<ProductOptionValue> allValues = valueRepo.findByOptionIdIn(optionIds);
        Map<UUID, List<ProductOptionValue>> valuesByOptionId = allValues.stream()
                .collect(Collectors.groupingBy(v -> v.getOption().getId()));

        // usage (đang được dùng trong bao nhiêu SKU)
        List<ProductVariantOptionValue> allVovs = variantOptionValueRepo.findByOptionIdIn(optionIds);
        Map<UUID, Long> skuUsedMap = allVovs.stream()
                .collect(Collectors.groupingBy(
                        vov -> vov.getOption().getId(),
                        Collectors.mapping(
                                vov -> vov.getVariant().getId(),
                                Collectors.collectingAndThen(
                                        Collectors.toSet(),
                                        set -> (long) set.size()
                                )
                        )
                ));

        List<ProductOptionListItemResponse> result = new ArrayList<>();
        for (ProductOption opt : options) {
            List<ProductOptionValue> vals = valuesByOptionId.getOrDefault(opt.getId(), List.of());

            ProductOptionListItemResponse dto = new ProductOptionListItemResponse();
            dto.setId(opt.getId());
            dto.setName(opt.getName());
            dto.setValues(
                    vals.stream()
                            .map(ProductOptionValue::getValue)
                            .toList()
            );
            dto.setValueCount(vals.size());
            dto.setSkuUsed(skuUsedMap.getOrDefault(opt.getId(), 0L));

            result.add(dto);
        }

        result.sort(Comparator.comparing(ProductOptionListItemResponse::getName, String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    /* ========== DETAIL ========== */
    @Transactional(readOnly = true)
    public ProductOptionDetailResponse getDetail(UUID id) {
        ProductOption opt = optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option không tồn tại: " + id));

        List<ProductOptionValue> values = valueRepo.findByOptionId(opt.getId());

        ProductOptionDetailResponse resp = new ProductOptionDetailResponse();
        resp.setId(opt.getId());
        resp.setName(opt.getName());
        resp.setValues(
                values.stream().map(v -> {
                    ProductOptionDetailResponse.OptionValueInfo dto =
                            new ProductOptionDetailResponse.OptionValueInfo();
                    dto.setId(v.getId());
                    dto.setValue(v.getValue());
                    return dto;
                }).toList()
        );

        return resp;
    }

    /* ========== UPDATE ========== */
    public void update(UUID id, ProductOptionRequest req) {
        ProductOption opt = optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option không tồn tại: " + id));

        if (req.getOption() == null || req.getOption().getName() == null
                || req.getOption().getName().trim().isEmpty()) {
            throw new RuntimeException("Tên option là bắt buộc");
        }

        String newName = req.getOption().getName().trim();

        // check trùng tên với option khác
        optionRepo.findByNameIgnoreCase(newName)
                .filter(o -> !o.getId().equals(id))
                .ifPresent(o -> {
                    throw new RuntimeException("Tên option đã tồn tại: " + newName);
                });

        List<String> cleanedValues = normalizeValues(req.getValues());
        if (cleanedValues.isEmpty()) {
            throw new RuntimeException("Cần ít nhất 1 giá trị cho option.");
        }

        opt.setName(newName);
        optionRepo.save(opt);

        // xử lý value
        List<ProductOptionValue> existing = valueRepo.findByOptionId(opt.getId());

        // map valueText -> entity
        Map<String, ProductOptionValue> existingByText = existing.stream()
                .collect(Collectors.toMap(
                        v -> v.getValue().toLowerCase(),
                        v -> v,
                        (a, b) -> a
                ));

        Set<UUID> toKeep = new HashSet<>();

        // tạo mới hoặc giữ lại
        for (String valText : cleanedValues) {
            String key = valText.toLowerCase();
            ProductOptionValue pov = existingByText.get(key);
            if (pov == null) {
                pov = new ProductOptionValue();
                pov.setOption(opt);
                pov.setValue(valText);
                valueRepo.save(pov);
            }
            toKeep.add(pov.getId());
        }

        // xoá value không còn trong request & không được sử dụng
        for (ProductOptionValue oldVal : existing) {
            if (!toKeep.contains(oldVal.getId())) {
                boolean used = variantOptionValueRepo.existsByOptionValueId(oldVal.getId());
                if (!used) {
                    valueRepo.delete(oldVal);
                }
                // nếu đang được dùng thì giữ lại
            }
        }
    }

    /* ========== DELETE ========== */
    public void delete(UUID id) {
        ProductOption opt = optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option không tồn tại: " + id));

        boolean used = variantOptionValueRepo.existsByOptionId(id);
        if (used) {
            throw new RuntimeException("Không thể xoá option vì đang được sử dụng trong SKU.");
        }

        List<ProductOptionValue> values = valueRepo.findByOptionId(opt.getId());
        valueRepo.deleteAll(values);
        optionRepo.delete(opt);
    }
}
