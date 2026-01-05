// src/pages/admin/ProductCreate.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

/* ===================== TIỆN ÍCH ===================== */
function toSlug(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function cartesian(arrays) {
  if (!arrays.length) return [];
  return arrays.reduce(
    (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
    [[]]
  );
}

// Helper gọi API, dùng apiFetch để tự đính kèm token / baseURL
async function fetchJson(url, options = {}) {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return res.json();
}

/* ===================== COMPONENT ===================== */
function ProductCreate() {
  const navigate = useNavigate();
  const location = useLocation();

  // lấy mode & productId từ navigate(..., { state })
  const { mode: navMode, productId } = location.state || {};
  const mode = navMode || "create"; // create | edit | view

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  // ---- Sidebar/header state ----
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-create");
  const [notificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // ---- Product form state ----
  const [basic, setBasic] = useState({
    code: "",
    name: "",
    slug: "",
    brand_id: "",
    is_published: false,
    short_description: "",
    description: "",
    category_ids: [],
  });

  // Master data từ BE
  const [brands, setBrands] = useState([]); // [{id, name, ...}]
  const [categories, setCategories] = useState([]); // [{id, name, parent_id, ...}]

  // 👉 CHỈ LẤY CÁC DANH MỤC CON (có parent_id) ĐỂ HIỂN THỊ
  const childCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parent_id != null) // chỉ những thằng có cha
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [categories]
  );

  // Spec attributes master
  // attributes: [{id, name, ...}]
  const [specAttributesMaster, setSpecAttributesMaster] = useState([]);
  // specValuesByAttr: { [attrId]: [{id, spec_value_text}] }
  const [specValuesByAttr, setSpecValuesByAttr] = useState({});

  // Product options (option groups master)
  // optionGroupsMaster: [{id, name}]
  const [optionGroupsMaster, setOptionGroupsMaster] = useState([]);
  // optionValuesByGroup: { [groupId]: [{id, label}] }
  const [optionValuesByGroup, setOptionValuesByGroup] = useState({});

  // Ảnh chung & Thumbnail bắt buộc
  const [pictures, setPictures] = useState([]); // [{url, alt_text}]
  const [thumbnailUrl, setThumbnailUrl] = useState(""); // url ảnh thumbnail đã chọn

  // loading state
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  /* ===================== 3) THÔNG SỐ KỸ THUẬT – CHỌN TỪ MASTER (VIA MODAL) ===================== */
  // [{ attrId, name, valueIds: string[] }]
  const [specGroups, setSpecGroups] = useState([]);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specModalSelection, setSpecModalSelection] = useState("");

  function openSpecModal() {
    if (isViewMode) return;
    setShowSpecModal(true);
  }
  function closeSpecModal() {
    setShowSpecModal(false);
    setSpecModalSelection("");
  }

  // Đảm bảo đã load danh sách value cho attribute từ BE
  async function ensureSpecValuesLoaded(attrId) {
    if (!attrId) return;
    if (specValuesByAttr[attrId]) return; // đã load rồi

    try {
      const detail = await fetchJson(`/api/admin/spec-attributes/${attrId}`, {
        method: "GET",
      });

      const values =
        detail.values?.map((v) => ({
          id: v.id,
          spec_value_text: v.specValueText || v.spec_value_text || "",
        })) || [];

      setSpecValuesByAttr((prev) => ({
        ...prev,
        [attrId]: values,
      }));
    } catch (err) {
      console.error("Lỗi load spec attribute detail:", err);
      // không throw để tránh crash UI
    }
  }

  async function confirmAddSpecGroup() {
    if (!specModalSelection) return;
    const attrId = specModalSelection;
    if (specGroups.some((g) => g.attrId === attrId)) {
      closeSpecModal();
      return;
    }

    const attr = specAttributesMaster.find((a) => a.id === attrId);
    if (!attr) return;

    // load value cho attribute nếu chưa có
    await ensureSpecValuesLoaded(attrId);

    setSpecGroups((prev) => [
      ...prev,
      { attrId, name: attr.name, valueIds: [] },
    ]);
    closeSpecModal();
  }

  function removeSpecGroup(attrId) {
    if (isViewMode) return;
    setSpecGroups((prev) => prev.filter((g) => g.attrId !== attrId));
  }

  function toggleSpecValue(attrId, valueId) {
    if (isViewMode) return;
    setSpecGroups((prev) =>
      prev.map((g) => {
        if (g.attrId !== attrId) return g;
        const set = new Set(g.valueIds);
        set.has(valueId) ? set.delete(valueId) : set.add(valueId);
        return { ...g, valueIds: Array.from(set) };
      })
    );
  }

  /* ===================== 4) OPTION NHÓM – CHỌN TỪ MASTER (VIA MODAL) & SINH VARIANTS ===================== */
  // [{ groupId, name, valueIds: string[] }]
  const [selectedOptionGroups, setSelectedOptionGroups] = useState([]);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [optionModalSelection, setOptionModalSelection] = useState("");

  function openOptionModal() {
    if (isViewMode) return;
    setShowOptionModal(true);
  }
  function closeOptionModal() {
    setShowOptionModal(false);
    setOptionModalSelection("");
  }

  async function ensureOptionValuesLoaded(groupId) {
    if (!groupId) return;
    if (optionValuesByGroup[groupId]) return;

    try {
      const detail = await fetchJson(`/api/admin/product-options/${groupId}`, {
        method: "GET",
      });

      const values =
        detail.values?.map((v) => ({
          id: v.id,
          label: v.value,
        })) || [];

      setOptionValuesByGroup((prev) => ({
        ...prev,
        [groupId]: values,
      }));
    } catch (err) {
      console.error("Lỗi load product option detail:", err);
    }
  }

  async function confirmAddOptionGroup() {
    if (!optionModalSelection) return;
    const gid = optionModalSelection;
    if (selectedOptionGroups.some((g) => g.groupId === gid)) {
      closeOptionModal();
      return;
    }

    const master = optionGroupsMaster.find((g) => g.id === gid);
    if (!master) return;

    // Load full values cho group nếu chưa có
    await ensureOptionValuesLoaded(gid);

    setSelectedOptionGroups((prev) => [
      ...prev,
      { groupId: gid, name: master.name, valueIds: [] },
    ]);
    closeOptionModal();
  }

  function removeOptionGroup(groupId) {
    if (isViewMode) return;
    setSelectedOptionGroups((prev) =>
      prev.filter((g) => g.groupId !== groupId)
    );
    setVariants([]);
  }

  function toggleOptionValue(groupId, valueId) {
    if (isViewMode) return;
    setSelectedOptionGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        const set = new Set(g.valueIds);
        set.has(valueId) ? set.delete(valueId) : set.add(valueId);
        return { ...g, valueIds: Array.from(set) };
      })
    );
  }

  const [variants, setVariants] = useState([]);

  function handleBasicChange(field, value) {
    if (isViewMode) return;
    setBasic((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !prev.slug) next.slug = toSlug(value);
      if (field === "name" && !prev.code)
        next.code = value.toUpperCase().replace(/\s+/g, "-");
      if (field === "name" && next.code && next.code.length > 30)
        next.code = next.code.slice(0, 30);
      if (field === "name" && next.slug && next.slug.length > 80)
        next.slug = next.slug.slice(0, 80);
      return next;
    });
  }

  function toggleCategory(catId) {
    if (isViewMode) return;
    setBasic((prev) => {
      const set = new Set(prev.category_ids);
      if (set.has(catId)) set.delete(catId);
      else set.add(catId);
      return { ...prev, category_ids: Array.from(set) };
    });
  }

  // ====== CALL API UPLOAD ẢNH ======>
  async function uploadRealImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("/api/public/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // BE CloudinaryService trả: { url, publicId, size }
    return res.data;
  }

  // ====== ADD PICTURE (DÙNG FILE INPUT + UPLOAD) ======
  async function addPicture() {
    if (isViewMode) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      if (!input.files || !input.files.length) return;
      const file = input.files[0];

      try {
        const uploaded = await uploadRealImage(file);

        const newPic = {
          url: uploaded.url,
          alt_text: basic.name || "Ảnh sản phẩm",
        };

        setPictures((prev) => {
          const next = [...prev, newPic];
          if (!thumbnailUrl && next.length === 1) {
            setThumbnailUrl(newPic.url);
          }
          return next;
        });
      } catch (err) {
        console.error("Upload ảnh lỗi:", err);
        alert(
          "Upload ảnh thất bại: " + (err.response?.data?.message || err.message)
        );
      }
    };

    input.click();
  }

  function removePicture(idx) {
    if (isViewMode) return;
    setPictures((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx]?.url === thumbnailUrl) {
        setThumbnailUrl(next[0]?.url || "");
      }
      return next;
    });
  }

  // ===== GENERATE VARIANTS =====
  function validateOptionsReady() {
    if (!selectedOptionGroups.length)
      return { ok: false, reason: "Chưa chọn nhóm option nào." };
    const empty = selectedOptionGroups.filter((g) => g.valueIds.length === 0);
    if (empty.length > 0)
      return {
        ok: false,
        reason: `Nhóm thiếu giá trị: ${empty.map((g) => g.name).join(", ")}`,
      };
    return { ok: true };
  }

  function generateVariants() {
    if (isViewMode) return;

    const chk = validateOptionsReady();
    if (!chk.ok) {
      alert(`Không thể sinh biến thể.\n${chk.reason}`);
      return;
    }

    const valueArrays = selectedOptionGroups.map((g) => {
      const allValues = optionValuesByGroup[g.groupId] || [];
      return g.valueIds.map((vId) => {
        const val = allValues.find((v) => v.id === vId);
        return {
          groupId: g.groupId,
          groupName:
            optionGroupsMaster.find((x) => x.id === g.groupId)?.name || "",
          valueId: vId,
          valueLabel: val?.label || "",
        };
      });
    });

    const combos = cartesian(valueArrays);

    const nextVariants = combos.map((combo, idx) => {
      // SKU HIỂN THỊ (ngắn)
      const sku = combo.map((x) => x.valueLabel).join("/");

      // NAME LƯU DB (đầy đủ, unique)
      const name = `${basic.code}-${combo
        .map((x) => toSlug(x.valueLabel))
        .join("-")}`.toUpperCase();

      return {
        id: idx + 1,
        product_id: null,
        included: true,
        sku,
        name,
        discount_price: null,
        price: null,
        is_active: true,
        options: combo,
      };
    });

    setVariants(nextVariants);
  }

  function toggleVariantIncluded(variantId) {
    if (isViewMode) return;
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, included: !v.included } : v
      )
    );
  }

  function updateVariantField(variantId, field, value) {
    if (isViewMode) return;
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
    );
  }

  // ====== TÍNH KHOẢNG GIÁ & BIẾN THỂ RẺ NHẤT ======
  const priceSummary = useMemo(() => {
    const included = variants.filter((v) => v && v.included);
    if (!included.length) return null;

    const withEffective = included
      .map((v) => ({
        ...v,
        effectivePrice: v.discount_price ?? v.price,
      }))
      .filter((v) => v.effectivePrice != null);

    if (!withEffective.length) return null;

    const prices = withEffective.map((v) => v.effectivePrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    let cheapest = null;
    withEffective.forEach((v) => {
      if (!cheapest || v.effectivePrice < cheapest.effectivePrice) {
        cheapest = v;
      }
    });

    return {
      min,
      max,
      cheapestName: cheapest.name,
      cheapestBasePrice: cheapest.price ?? null,
      cheapestSalePrice: cheapest.discount_price ?? null,
    };
  }, [variants]);

  /* ===================== LOAD MASTER DATA (BRAND, CATEGORY, SPEC ATTR, PRODUCT OPTION) ===================== */
  useEffect(() => {
    const loadMasters = async () => {
      try {
        setLoadingMasters(true);
        const [brandData, categoryData, specAttrData, optionData] =
          await Promise.all([
            fetchJson("/api/public/brands", { method: "GET" }).catch((e) => {
              console.error("Lỗi load brands:", e);
              return [];
            }),
            fetchJson("/api/public/categories", { method: "GET" }).catch(
              (e) => {
                console.error("Lỗi load categories:", e);
                return [];
              }
            ),
            fetchJson("/api/admin/spec-attributes", { method: "GET" }).catch(
              (e) => {
                console.error("Lỗi load spec attributes:", e);
                return [];
              }
            ),
            fetchJson("/api/admin/product-options", { method: "GET" }).catch(
              (e) => {
                console.error("Lỗi load product options:", e);
                return [];
              }
            ),
          ]);

        setBrands(
          Array.isArray(brandData)
            ? brandData.map((b) => ({
                id: b.id,
                name: b.name,
                slug: b.slug,
              }))
            : []
        );

        setCategories(
          Array.isArray(categoryData)
            ? categoryData.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                parent_id: c.parent_id ?? c.parentId ?? null,
                display_order: c.display_order ?? c.displayOrder ?? null,
              }))
            : []
        );

        setSpecAttributesMaster(
          Array.isArray(specAttrData)
            ? specAttrData.map((a) => ({
                id: a.id,
                name: a.name,
              }))
            : []
        );

        setOptionGroupsMaster(
          Array.isArray(optionData)
            ? optionData.map((o) => ({
                id: o.id,
                name: o.name,
              }))
            : []
        );
      } finally {
        setLoadingMasters(false);
      }
    };

    loadMasters();
  }, []);

  // ===== LOAD DETAIL KHI EDIT / VIEW =====
  useEffect(() => {
    if (!productId || isCreateMode) return;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const data = await fetchJson(`/api/admin/products/${productId}`, {
          method: "GET",
        });

        const p = data.product || {};

        setBasic({
          code: p.code || "",
          name: p.name || "",
          slug: p.slug || "",
          brand_id: p.brand_id || p.brand?.id || "",
          is_published: !!p.is_published,
          short_description: p.short_description || "",
          description: p.description || "",
          category_ids: Array.isArray(p.categories)
            ? p.categories.map((c) => (typeof c === "string" ? c : c.id))
            : [],
        });

        setThumbnailUrl(p.thumbnail_url || "");

        setPictures(
          Array.isArray(data.pictures)
            ? data.pictures.map((pic) => ({
                url: pic.url,
                alt_text: pic.alt_text || "",
              }))
            : []
        );

        // specs
        const specs = Array.isArray(data.specifications)
          ? data.specifications
          : [];
        const specMap = new Map();
        specs.forEach((s) => {
          const attrId =
            s.specification_attribute_id ||
            s.attribute_id ||
            s.attr_id ||
            s.spec_attribute_id;
          const attrName =
            s.specification_attribute_name ||
            s.attribute_name ||
            s.attr_name ||
            s.spec_attribute_name ||
            "";
          const valId =
            s.specification_value_id ||
            s.value_id ||
            s.spec_value_id ||
            s.specificationValueId;
          if (!attrId || !valId) return;
          if (!specMap.has(attrId)) {
            specMap.set(attrId, { attrId, name: attrName, valueIds: [] });
          }
          const group = specMap.get(attrId);
          if (!group.valueIds.includes(valId)) group.valueIds.push(valId);
        });
        const specGroupsArr = Array.from(specMap.values());
        setSpecGroups(specGroupsArr);

        // load full values cho các attr trong specGroups
        const attrIdsToLoad = specGroupsArr.map((g) => g.attrId);
        await Promise.all(
          attrIdsToLoad.map((id) => ensureSpecValuesLoaded(id))
        );

        // variants & options
        const variantsFromApi = Array.isArray(data.variants)
          ? data.variants
          : [];

        // selectedOptionGroups từ variants
        const optionGroupMap = new Map();
        variantsFromApi.forEach((v) => {
          (v.options || []).forEach((o) => {
            const optionId = o.option_id || o.optionId;
            if (!optionId) return;
            const optionName =
              o.option_name || o.optionName || o.group_name || "";
            const valueId = o.option_value_id || o.optionValueId;
            const valueLabel =
              o.option_value_label || o.optionValueLabel || o.value_label || "";
            if (!valueId) return;

            if (!optionGroupMap.has(optionId)) {
              optionGroupMap.set(optionId, {
                groupId: optionId,
                name: optionName,
                valueIds: [],
              });
            }
            const grp = optionGroupMap.get(optionId);
            if (!grp.valueIds.includes(valueId)) grp.valueIds.push(valueId);

            // đồng thời fill optionValuesByGroup để hiển thị checkbox
            setOptionValuesByGroup((prev) => {
              const existing = prev[optionId] || [];
              if (!existing.some((v) => v.id === valueId)) {
                return {
                  ...prev,
                  [optionId]: [...existing, { id: valueId, label: valueLabel }],
                };
              }
              return prev;
            });
          });
        });
        const selectedGroupsArr = Array.from(optionGroupMap.values());
        setSelectedOptionGroups(selectedGroupsArr);

        // sinh variants state từ API
        const nextVariants = variantsFromApi.map((v, idx) => {
          const optionObjs = (v.options || []).map((o) => {
            const optionId = o.option_id || o.optionId;
            const valueId = o.option_value_id || o.optionValueId;
            const groupName =
              o.option_name ||
              o.optionName ||
              o.group_name ||
              optionGroupsMaster.find((m) => m.id === optionId)?.name ||
              "";
            const valueLabel =
              o.option_value_label || o.optionValueLabel || o.value_label || "";

            return {
              groupId: optionId,
              groupName,
              valueId,
              valueLabel,
            };
          });

          return {
            id: v.id || idx + 1,
            product_id: p.id || productId,
            included: v.is_active ?? v.active ?? true,
            sku: v.sku,
            name: v.name,
            discount_price: v.discount_price ?? null,
            price: v.price ?? null,
            is_active: v.is_active ?? v.active ?? true,
            options: optionObjs,
          };
        });
        setVariants(nextVariants);
      } catch (err) {
        console.error("Lỗi khi load chi tiết sản phẩm:", err);
        alert("Không load được chi tiết sản phẩm: " + err.message);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [productId, isCreateMode, optionGroupsMaster]);

  // ---- Validate + Save ----
  function validate() {
    const errs = [];
    if (!basic.name.trim()) errs.push("Tên sản phẩm bắt buộc");
    if (!basic.code.trim()) errs.push("Mã sản phẩm (code) bắt buộc");
    if (!basic.slug.trim()) errs.push("Slug bắt buộc");
    if (!basic.brand_id) errs.push("Chọn thương hiệu");
    if (!basic.category_ids.length) errs.push("Chọn ít nhất 1 danh mục");

    if (!pictures.length) errs.push("Thêm ít nhất 1 ảnh sản phẩm");
    if (!thumbnailUrl) errs.push("Chọn ảnh thumbnail cho sản phẩm");

    const optChk = validateOptionsReady();
    if (!optChk.ok) errs.push(`Option chưa sẵn sàng: ${optChk.reason}`);
    if (!variants.length) errs.push("Chưa sinh biến thể (SKU)");

    const included = variants.filter((v) => v.included);
    if (!included.length) errs.push("Chưa chọn biến thể nào (tick Include)");

    included.forEach((v) => {
      if (!v.sku || !v.sku.trim()) errs.push(`SKU trống ở cấu hình: ${v.name}`);
      const price = Number(v.price ?? 0);
      const discount =
        v.discount_price != null ? Number(v.discount_price) : null;
      if (!(price > 0)) errs.push(`Giá bán > 0 ở SKU ${v.sku || v.name}`);
      if (discount != null && discount > price)
        errs.push(
          `Giảm giá không được lớn hơn giá bán ở SKU ${v.sku || v.name}`
        );
    });

    if (basic.is_published) {
      const hasPriced = included.some((v) => (v.discount_price ?? v.price) > 0);
      if (!hasPriced)
        errs.push("Để Publish: ít nhất 1 SKU được chọn phải có giá > 0");
    }

    return errs;
  }

  async function onSave() {
    if (isViewMode) return;

    const errors = validate();
    if (errors.length) {
      alert("Vui lòng kiểm tra:\n- " + errors.join("\n- "));
      return;
    }

    const included = variants.filter((v) => v.included);

    const specPayload = specGroups.flatMap((g) =>
      g.valueIds.map((vId) => ({ specification_value_id: vId }))
    );

    const payload = {
      product: {
        code: basic.code.trim(),
        name: basic.name.trim(),
        slug: basic.slug.trim(),
        brand_id: basic.brand_id,
        is_published: !!basic.is_published,
        short_description: basic.short_description,
        description: basic.description,
        thumbnail_url: thumbnailUrl,
        categories: basic.category_ids,
      },
      pictures: pictures.map((p) => ({
        url: p.url,
        alt_text: p.alt_text,
      })),
      specifications: specPayload,
      variants: included.map((v) => ({
        sku: v.sku,
        name: v.name,
        discount_price: v.discount_price ? Number(v.discount_price) : null,
        price: v.price ? Number(v.price) : null,
        is_active: !!v.is_active,
        options: v.options.map((o) => ({
          option_id: o.groupId,
          option_value_id: o.valueId,
        })),
      })),
      // ❌ không gửi inventory nữa, tồn kho sẽ đi qua luồng Phiếu nhập
    };

    try {
      setSaving(true);

      const url = isEditMode
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Lỗi khi lưu sản phẩm");
      }

      const data = await res.json();
      console.log("Save product response:", data);
      alert(
        isEditMode
          ? "Cập nhật sản phẩm thành công!"
          : "Tạo sản phẩm thành công!"
      );

      navigate("/product-management/products");
    } catch (err) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      alert("Lỗi khi lưu sản phẩm: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const headerTitle = isCreateMode
    ? "Thêm sản phẩm"
    : isEditMode
    ? "Chỉnh sửa sản phẩm"
    : "Chi tiết sản phẩm";

  const formDisabled = saving || loadingDetail || loadingMasters || isViewMode;

  return (
    <div className="d-flex vh-100 bg-light text-dark">
      <Sidebar
        collapsed={sidebarCollapsed}
        activeMenu={activeMenu}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onSelectMenu={setActiveMenu}
        notificationCount={notificationCount}
        showUserDropdown={showUserDropdown}
        toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
      />

      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <HeaderAdmin
          title={headerTitle}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((v) => !v)}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
        />

        <main className="flex-grow-1 overflow-auto bg-light p-4">
          <div className="container-fluid p-0">
            {(loadingDetail || loadingMasters) && (
              <div className="alert alert-info">
                Đang tải dữ liệu sản phẩm / master...
              </div>
            )}

            {/* ====== 1) THÔNG TIN CƠ BẢN ====== */}
            <div className="card shadow-sm mb-4" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white">
                <strong>1) Thông tin cơ bản</strong>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tên sản phẩm *</label>
                    <input
                      className="form-control"
                      value={basic.name}
                      onChange={(e) =>
                        handleBasicChange("name", e.target.value)
                      }
                      disabled={formDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Mã sản phẩm (code) *</label>
                    <input
                      className="form-control"
                      value={basic.code}
                      onChange={(e) =>
                        handleBasicChange("code", e.target.value)
                      }
                      disabled={formDisabled}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Slug *</label>
                    <input
                      className="form-control"
                      value={basic.slug}
                      onChange={(e) =>
                        handleBasicChange("slug", e.target.value)
                      }
                      disabled={formDisabled}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Thương hiệu *</label>
                    <select
                      className="form-select"
                      value={basic.brand_id}
                      onChange={(e) =>
                        handleBasicChange("brand_id", e.target.value)
                      }
                      disabled={formDisabled}
                    >
                      <option value="">-- Chọn --</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Danh mục *</label>
                    <div className="d-flex flex-wrap gap-2">
                      {childCategories.map((c) => (
                        <label
                          key={c.id}
                          className="badge bg-secondary bg-opacity-10 text-secondary p-2"
                        >
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={basic.category_ids.includes(c.id)}
                            onChange={() => toggleCategory(c.id)}
                            disabled={formDisabled}
                          />
                          {c.name}
                        </label>
                      ))}
                      {!childCategories.length && (
                        <span className="small text-muted">
                          Chưa có danh mục con trong hệ thống.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={basic.is_published}
                        onChange={(e) =>
                          handleBasicChange("is_published", e.target.checked)
                        }
                        disabled={formDisabled}
                      />
                      <label className="form-check-label ms-2">
                        Publish ngay
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Mô tả ngắn</label>
                    <input
                      className="form-control"
                      value={basic.short_description}
                      onChange={(e) =>
                        handleBasicChange("short_description", e.target.value)
                      }
                      disabled={formDisabled}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={basic.description}
                      onChange={(e) =>
                        handleBasicChange("description", e.target.value)
                      }
                      disabled={formDisabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ====== 2) ẢNH (CHỌN THUMBNAIL BẮT BUỘC) ====== */}
            <div className="card shadow-sm mb-4" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white">
                <strong>2) Ảnh</strong>
              </div>
              <div className="card-body">
                {!isViewMode && (
                  <button
                    className="btn btn-outline-secondary mb-3"
                    onClick={addPicture}
                    disabled={saving}
                  >
                    <i className="fas fa-plus me-2" />
                    Thêm ảnh
                  </button>
                )}

                {thumbnailUrl && (
                  <div className="alert alert-info py-2">
                    Ảnh thumbnail hiện tại:{" "}
                    <code className="text-break">{thumbnailUrl}</code>
                  </div>
                )}

                <div className="d-flex flex-wrap gap-3">
                  {pictures.map((p, idx) => (
                    <div
                      key={idx}
                      style={{ width: 200 }}
                      className="border rounded p-2 bg-white"
                    >
                      <img
                        src={p.url}
                        alt={p.alt_text}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                        }}
                      />
                      <div className="small text-truncate mt-1">
                        {p.alt_text || "(no alt)"}
                      </div>
                      <div className="form-check mt-1">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="thumbnail"
                          id={`thumb-${idx}`}
                          checked={thumbnailUrl === p.url}
                          onChange={() => setThumbnailUrl(p.url)}
                          disabled={formDisabled}
                        />
                        <label
                          className="form-check-label ms-1"
                          htmlFor={`thumb-${idx}`}
                        >
                          Đặt làm thumbnail
                        </label>
                      </div>
                      {thumbnailUrl === p.url && (
                        <span className="badge bg-primary mt-1">Thumbnail</span>
                      )}
                      {!isViewMode && (
                        <button
                          className="btn btn-sm btn-link text-danger p-0 mt-1"
                          onClick={() => removePicture(idx)}
                          disabled={saving}
                        >
                          <i className="fas fa-trash-alt" /> Xoá
                        </button>
                      )}
                    </div>
                  ))}
                  {!pictures.length && (
                    <div className="text-muted">Chưa có ảnh.</div>
                  )}
                </div>
              </div>
            </div>

            {/* ====== 3) THÔNG SỐ KỸ THUẬT ====== */}
            <div className="card shadow-sm mb-4" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>3) Thông số kỹ thuật</strong>
                {!isViewMode && (
                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={openSpecModal}
                      disabled={saving}
                    >
                      <i className="fas fa-plus me-2" />
                      Thêm mới
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                {!specGroups.length && (
                  <div className="text-muted small">
                    Chưa chọn thuộc tính nào.
                  </div>
                )}
                {specGroups.map((g) => {
                  const values = specValuesByAttr[g.attrId] || [];
                  return (
                    <div key={g.attrId} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">{g.name}</div>
                        {!isViewMode && (
                          <button
                            className="btn btn-link p-0 text-danger"
                            onClick={() => removeSpecGroup(g.attrId)}
                            disabled={saving}
                          >
                            <i className="fas fa-trash-alt" /> Bỏ nhóm
                          </button>
                        )}
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {values.map((v) => (
                          <label
                            key={v.id}
                            className="badge bg-secondary bg-opacity-10 text-secondary p-2"
                          >
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              checked={g.valueIds.includes(v.id)}
                              onChange={() => toggleSpecValue(g.attrId, v.id)}
                              disabled={formDisabled}
                            />
                            {v.spec_value_text}
                          </label>
                        ))}
                        {!values.length && (
                          <span className="small text-muted">
                            (Chưa có giá trị cho thuộc tính này)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ====== 4) OPTION → SINH BIẾN THỂ ====== */}
            <div className="card shadow-sm mb-4" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>4) Option nhóm (bắt buộc) → sinh biến thể</strong>
                {!isViewMode && (
                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={openOptionModal}
                      disabled={saving}
                    >
                      <i className="fas fa-plus me-2" />
                      Thêm nhóm
                    </button>
                    <button
                      className="btn btn-sm btn-dark"
                      onClick={generateVariants}
                      disabled={saving}
                    >
                      <i className="fas fa-layer-group me-2" />
                      Sinh biến thể
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                {!selectedOptionGroups.length && (
                  <div className="small text-muted">
                    Chưa chọn nhóm option nào.
                  </div>
                )}

                {selectedOptionGroups.map((g) => {
                  const values = optionValuesByGroup[g.groupId] || [];
                  return (
                    <div key={g.groupId} className="mb-3 border rounded p-2">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="fw-semibold">{g.name}</div>
                        {!isViewMode && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-link p-0 text-danger"
                              onClick={() => removeOptionGroup(g.groupId)}
                              disabled={saving}
                            >
                              <i className="fas fa-trash-alt" /> Bỏ nhóm
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {values.map((val) => (
                          <label
                            key={val.id}
                            className="badge bg-secondary bg-opacity-10 text-secondary p-2"
                          >
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              checked={g.valueIds.includes(val.id)}
                              onChange={() =>
                                toggleOptionValue(g.groupId, val.id)
                              }
                              disabled={formDisabled}
                            />
                            {val.label}
                          </label>
                        ))}
                        {!values.length && (
                          <span className="small text-muted">
                            (Chưa có giá trị cho option này)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="small text-muted">
                  Sau khi chọn nhóm và giá trị, bấm <b>Sinh biến thể</b> để tạo
                  danh sách SKU. Bạn có thể bỏ tick những biến thể không bán.
                </div>
              </div>
            </div>

            {/* ====== 5) DANH SÁCH VARIANTS ====== */}
            <div className="card shadow-sm mb-4" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>5) Biến thể (SKU)</strong>
                {priceSummary && (
                  <span className="small text-muted">
                    Khoảng giá: {priceSummary.min.toLocaleString("vi-VN")} -{" "}
                    {priceSummary.max.toLocaleString("vi-VN")} | Biến thể rẻ
                    nhất: <strong>{priceSummary.cheapestName}</strong> (
                    {priceSummary.cheapestSalePrice != null ? (
                      <>
                        {priceSummary.cheapestSalePrice.toLocaleString("vi-VN")}
                        ₫{" "}
                        <span className="text-muted text-decoration-line-through">
                          {priceSummary.cheapestBasePrice?.toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </span>
                      </>
                    ) : (
                      <>
                        {priceSummary.cheapestBasePrice?.toLocaleString(
                          "vi-VN"
                        )}
                        ₫
                      </>
                    )}
                    )
                  </span>
                )}
              </div>
              <div className="table-responsive">
                <table
                  className="table mb-0"
                  style={{ tableLayout: "fixed", width: "100%" }}
                >
                  <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr className="border-bottom small text-secondary text-uppercase">
                      <th className="ps-3"></th>
                      <th>Cấu hình</th>
                      <th>SKU *</th>
                      <th>Giảm giá</th>
                      <th>Giá bán *</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="align-middle">
                        <td className="ps-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={v.included}
                            onChange={() => toggleVariantIncluded(v.id)}
                            disabled={formDisabled}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{v.name}</div>
                          <div className="small text-muted">
                            {v.options
                              .map((o) => `${o.groupName}: ${o.valueLabel}`)
                              .join(" • ")}
                          </div>
                        </td>
                        <td>
                          <input
                            className="form-control"
                            value={v.sku}
                            onChange={(e) =>
                              updateVariantField(v.id, "sku", e.target.value)
                            }
                            disabled={formDisabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={v.discount_price ?? ""}
                            onChange={(e) =>
                              updateVariantField(
                                v.id,
                                "discount_price",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            disabled={formDisabled}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={v.price ?? ""}
                            onChange={(e) =>
                              updateVariantField(
                                v.id,
                                "price",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            disabled={formDisabled}
                          />
                        </td>
                      </tr>
                    ))}
                    {!variants.length && (
                      <tr>
                        <td className="ps-3 py-3 text-muted" colSpan={5}>
                          Chưa có biến thể. Hãy chọn nhóm option & giá trị rồi
                          bấm <b>Sinh biến thể</b>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ====== ACTION BAR ====== */}
            <div className="d-flex justify-content-end gap-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
                disabled={saving}
              >
                Quay lại
              </button>
              {!isViewMode && (
                <button
                  className="btn btn-dark"
                  onClick={onSave}
                  disabled={saving || loadingDetail || loadingMasters}
                >
                  {saving
                    ? isEditMode
                      ? "Đang cập nhật..."
                      : "Đang lưu..."
                    : isEditMode
                    ? "Lưu thay đổi"
                    : "Lưu sản phẩm"}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ====== SPEC MODAL ====== */}
      {showSpecModal && !isViewMode && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,.35)", zIndex: 1050 }}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white rounded-3 shadow p-3"
            style={{ width: 520 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Thêm thuộc tính kỹ thuật</h6>
              <button className="btn btn-sm btn-light" onClick={closeSpecModal}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label">Chọn thuộc tính</label>
              <select
                className="form-select"
                value={specModalSelection}
                onChange={(e) => setSpecModalSelection(e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {specAttributesMaster
                  .filter((a) => !specGroups.some((g) => g.attrId === a.id))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={closeSpecModal}
              >
                Huỷ
              </button>
              <button
                className="btn btn-dark"
                onClick={confirmAddSpecGroup}
                disabled={!specModalSelection}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== OPTION MODAL ====== */}
      {showOptionModal && !isViewMode && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,.35)", zIndex: 1050 }}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white rounded-3 shadow p-3"
            style={{ width: 520 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Thêm nhóm option</h6>
              <button
                className="btn btn-sm btn-light"
                onClick={closeOptionModal}
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mb-3">
              <label className="form-label">Chọn nhóm option</label>
              <select
                className="form-select"
                value={optionModalSelection}
                onChange={(e) => setOptionModalSelection(e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {optionGroupsMaster
                  .filter(
                    (m) => !selectedOptionGroups.some((g) => g.groupId === m.id)
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={closeOptionModal}
              >
                Huỷ
              </button>
              <button
                className="btn btn-dark"
                onClick={confirmAddOptionGroup}
                disabled={!optionModalSelection}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCreate;
