package org.example.be.business.product.service;
import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.SpecAttributeDetailResponse;
import org.example.be.business.product.model.dto.SpecAttributeListItemResponse;
import org.example.be.business.product.model.dto.SpecAttributeRequest;
import org.example.be.business.product.model.entity.ProductSpecificationValue;
import org.example.be.business.product.model.entity.SpecificationAttribute;
import org.example.be.business.product.model.entity.SpecificationValue;
import org.example.be.business.product.repository.ProductSpecificationValueRepository;
import org.example.be.business.product.repository.SpecificationAttributeRepository;
import org.example.be.business.product.repository.SpecificationValueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SpecAttributeService {

    private final SpecificationAttributeRepository attributeRepo;
    private final SpecificationValueRepository valueRepo;
    private final ProductSpecificationValueRepository productSpecRepo;

    // ===== CREATE =====
    public UUID create(SpecAttributeRequest req) {
        if (req.getAttribute() == null || req.getAttribute().getName() == null
                || req.getAttribute().getName().trim().isEmpty()) {
            throw new RuntimeException("Tên thuộc tính là bắt buộc");
        }

        String name = req.getAttribute().getName().trim();
        if (attributeRepo.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Thuộc tính đã tồn tại: " + name);
        }

        // chuẩn hoá values (loại trống + trùng, giống FE)
        List<String> cleanedValues = normalizeValues(req.getValues());
        if (cleanedValues.isEmpty()) {
            throw new RuntimeException("Cần ít nhất 1 giá trị cho thuộc tính.");
        }

        SpecificationAttribute attr = new SpecificationAttribute();
        attr.setName(name);
        attributeRepo.save(attr);

        for (String valText : cleanedValues) {
            SpecificationValue sv = new SpecificationValue();
            sv.setAttribute(attr);
            sv.setValueText(valText);
            valueRepo.save(sv);
        }

        return attr.getId();
    }

    private List<String> normalizeValues(List<SpecAttributeRequest.ValueDTO> list) {
        if (list == null) return List.of();
        Set<String> seen = new HashSet<>();
        List<String> result = new ArrayList<>();
        for (SpecAttributeRequest.ValueDTO v : list) {
            String t = v.getSpecValueText() != null ? v.getSpecValueText().trim() : "";
            if (t.isEmpty()) continue;
            String key = t.toLowerCase();
            if (seen.contains(key)) continue;
            seen.add(key);
            result.add(t);
        }
        return result;
    }

    // ===== LIST =====
    @Transactional(readOnly = true)
    public List<SpecAttributeListItemResponse> listAll() {
        List<SpecificationAttribute> attrs = attributeRepo.findAll();
        if (attrs.isEmpty()) return List.of();

        List<UUID> attrIds = attrs.stream().map(SpecificationAttribute::getId).toList();
        List<SpecificationValue> allValues = valueRepo.findAll().stream()
                .filter(v -> attrIds.contains(v.getAttribute().getId()))
                .toList();

        Map<UUID, List<SpecificationValue>> valuesByAttr = allValues.stream()
                .collect(Collectors.groupingBy(v -> v.getAttribute().getId()));

        List<SpecAttributeListItemResponse> result = new ArrayList<>();
        for (SpecificationAttribute attr : attrs) {
            List<SpecificationValue> vals = valuesByAttr.getOrDefault(attr.getId(), List.of());
            SpecAttributeListItemResponse dto = new SpecAttributeListItemResponse();
            dto.setId(attr.getId());
            dto.setName(attr.getName());
            dto.setValueCount(vals.size());
            dto.setValuesPreview(
                    vals.stream()
                            .map(SpecificationValue::getValueText)
                            .limit(3)
                            .toList()
            );
            result.add(dto);
        }

        result.sort(Comparator.comparing(SpecAttributeListItemResponse::getName, String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    // ===== DETAIL =====
    @Transactional(readOnly = true)
    public SpecAttributeDetailResponse getDetail(UUID id) {
        SpecificationAttribute attr = attributeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Spec attribute not found: " + id));

        List<SpecificationValue> values = valueRepo.findByAttributeId(attr.getId());

        SpecAttributeDetailResponse resp = new SpecAttributeDetailResponse();
        resp.setId(attr.getId());
        resp.setName(attr.getName());
        resp.setValues(
                values.stream().map(v -> {
                    SpecAttributeDetailResponse.ValueInfo dto = new SpecAttributeDetailResponse.ValueInfo();
                    dto.setId(v.getId());
                    dto.setSpecValueText(v.getValueText());
                    return dto;
                }).toList()
        );

        return resp;
    }

    // ===== UPDATE =====
    public void update(UUID id, SpecAttributeRequest req) {
        SpecificationAttribute attr = attributeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Spec attribute not found: " + id));

        if (req.getAttribute() == null || req.getAttribute().getName() == null
                || req.getAttribute().getName().trim().isEmpty()) {
            throw new RuntimeException("Tên thuộc tính là bắt buộc");
        }

        String newName = req.getAttribute().getName().trim();
        // check trùng tên với attribute khác
        attributeRepo.findByNameIgnoreCase(newName)
                .filter(a -> !a.getId().equals(id))
                .ifPresent(a -> {
                    throw new RuntimeException("Tên thuộc tính đã tồn tại: " + newName);
                });

        List<String> cleanedValues = normalizeValues(req.getValues());
        if (cleanedValues.isEmpty()) {
            throw new RuntimeException("Cần ít nhất 1 giá trị cho thuộc tính.");
        }

        attr.setName(newName);
        attributeRepo.save(attr);

        // xử lý values
        List<SpecificationValue> existing = valueRepo.findByAttributeId(attr.getId());

        // map theo valueText (case-insensitive)
        Map<String, SpecificationValue> existingByText = existing.stream()
                .collect(Collectors.toMap(
                        v -> v.getValueText().toLowerCase(),
                        v -> v,
                        (a, b) -> a
                ));

        Set<UUID> toKeep = new HashSet<>();

        // tạo mới hoặc giữ lại
        for (String valText : cleanedValues) {
            String key = valText.toLowerCase();
            SpecificationValue sv = existingByText.get(key);
            if (sv == null) {
                sv = new SpecificationValue();
                sv.setAttribute(attr);
                sv.setValueText(valText);
                valueRepo.save(sv);
            }
            toKeep.add(sv.getId());
        }

        // xoá những value không còn trong request & không được sử dụng
        for (SpecificationValue oldVal : existing) {
            if (!toKeep.contains(oldVal.getId())) {
                boolean used = productSpecRepo.existsBySpecificationValueId(oldVal.getId());
                if (!used) {
                    valueRepo.delete(oldVal);
                }
                // nếu đang được dùng thì giữ lại, tránh vỡ dữ liệu
            }
        }
    }

    // ===== DELETE =====
    public void delete(UUID id) {
        SpecificationAttribute attr = attributeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Spec attribute not found: " + id));

        // nếu có product đang dùng -> không cho xoá
        boolean used = productSpecRepo.existsBySpecificationValueAttributeId(id);
        if (used) {
            throw new RuntimeException("Không thể xoá thuộc tính vì đang được sử dụng bởi sản phẩm.");
        }

        // xoá toàn bộ values của attribute rồi xoá attribute
        List<SpecificationValue> values = valueRepo.findByAttributeId(attr.getId());
        valueRepo.deleteAll(values);
        attributeRepo.delete(attr);
    }
}
