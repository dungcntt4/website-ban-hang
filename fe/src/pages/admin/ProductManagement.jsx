// src/pages/admin/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";

/* ===================== MOCK DATA THEO SCHEMA MỚI ===================== */
// Brand
const BRANDS = [
  { id: 1, name: "ASUS", slug: "asus", image: "/images/brand-asus.png" },
  { id: 2, name: "Acer", slug: "acer", image: "/images/brand-acer.png" },
  { id: 3, name: "Dell", slug: "dell", image: "/images/brand-dell.png" },
];

// Category
const CATEGORIES = [
  { id: 10, name: "Laptop", slug: "laptop", parent_id: null, display_order: 1 },
  { id: 11, name: "Gaming", slug: "gaming", parent_id: 10, display_order: 2 },
  { id: 12, name: "Office", slug: "office", parent_id: 10, display_order: 3 },
];

// Product + nối category qua product_category
const PRODUCTS = [
  {
    id: 100,
    code: "ASUS-TUF-A15-2024",
    name: "ASUS TUF A15 2024",
    slug: "asus-tuf-a15-2024",
    brand_id: 1,
    is_published: true,
    short_description: "Ryzen 7 7840HS, RTX 4060, 16GB/512GB",
    description: "Laptop gaming bền bỉ, màn 144Hz, tản nhiệt tốt.",
    total_sold: 120,
    total_reviews: 36,
    average_rating: 4.6,
    created_at: "2025-01-10T08:00:00Z",
    updated_at: "2025-02-01T10:00:00Z",
    product_category: [{ product_id: 100, category_id: 11 }], // Gaming
  },
  {
    id: 101,
    code: "DELL-INS-3530",
    name: "Dell Inspiron 3530",
    slug: "dell-inspiron-3530",
    brand_id: 3,
    is_published: false,
    short_description: "i5-1335U, 16GB/512GB, văn phòng",
    description: "Mỏng nhẹ, pin ổn, bàn phím êm.",
    total_sold: 42,
    total_reviews: 11,
    average_rating: 4.2,
    created_at: "2025-01-18T08:00:00Z",
    updated_at: "2025-02-02T10:00:00Z",
    product_category: [{ product_id: 101, category_id: 12 }], // Office
  },
];

// Picture
const PICTURES = [
  {
    id: 5001,
    product_id: 100,
    url: "https://picsum.photos/seed/p100a/400/300",
    alt_text: "ASUS A15 - 1",
  },
  {
    id: 5002,
    product_id: 100,
    url: "https://picsum.photos/seed/p100b/400/300",
    alt_text: "ASUS A15 - 2",
  },
  {
    id: 5101,
    product_id: 101,
    url: "https://picsum.photos/seed/p101a/400/300",
    alt_text: "Dell 3530 - 1",
  },
];

// Options/values (chưa render tại list)
const PRODUCT_OPTIONS = [
  { id: 1, name: "RAM" },
  { id: 2, name: "SSD" },
  { id: 3, name: "Màu sắc" },
];
const PRODUCT_OPTION_VALUES = [
  { id: 11, option_id: 1, value: "16GB" },
  { id: 12, option_id: 1, value: "32GB" },
  { id: 21, option_id: 2, value: "512GB" },
  { id: 22, option_id: 2, value: "1TB" },
  { id: 31, option_id: 3, value: "Đen" },
];

// Variants (SKU) + giá
const PRODUCT_VARIANTS = [
  {
    id: 1001,
    product_id: 100,
    sku: "A15-16-512-BL",
    name: "16GB/512GB Đen",
    cost_price: 19990000,
    discount_price: 22990000,
    price: 24990000,
    is_active: true,
    created_at: "2025-01-10",
    updated_at: "2025-01-10",
  },
  {
    id: 1002,
    product_id: 100,
    sku: "A15-32-1TB-BL",
    name: "32GB/1TB Đen",
    cost_price: 23990000,
    discount_price: null,
    price: 28990000,
    is_active: true,
    created_at: "2025-01-10",
    updated_at: "2025-01-10",
  },
  {
    id: 1011,
    product_id: 101,
    sku: "INS3530-16-512-GR",
    name: "16GB/512GB Xám",
    cost_price: 10990000,
    discount_price: 11990000,
    price: 12990000,
    is_active: false,
    created_at: "2025-01-18",
    updated_at: "2025-01-18",
  },
];

// Inventory theo SKU
const INVENTORY_ITEMS = [
  { id: 1, variant_id: 1001, stock_on_hand: 12, stock_reserved: 1 },
  { id: 2, variant_id: 1002, stock_on_hand: 7, stock_reserved: 0 },
  { id: 3, variant_id: 1011, stock_on_hand: 5, stock_reserved: 0 },
];

/* ===================== TIỆN ÍCH GHÉP DỮ LIỆU ===================== */
function joinBrand(product) {
  return BRANDS.find((b) => b.id === product.brand_id) || null;
}
function mainPicture(productId) {
  const pics = PICTURES.filter((p) => p.product_id === productId);
  return pics[0]?.url || "https://via.placeholder.com/80x80?text=IMG";
}
function categoryNames(product) {
  const ids = (product.product_category || []).map((pc) => pc.category_id);
  return CATEGORIES.filter((c) => ids.includes(c.id)).map((c) => c.name);
}
function variantsOf(productId) {
  return PRODUCT_VARIANTS.filter((v) => v.product_id === productId);
}
function stockForVariant(variantId) {
  const inv = INVENTORY_ITEMS.find((i) => i.variant_id === variantId);
  return inv ? inv.stock_on_hand : 0;
}
function aggregateStock(productId) {
  return variantsOf(productId).reduce(
    (sum, v) => sum + stockForVariant(v.id),
    0
  );
}
function priceRange(productId) {
  const vs = variantsOf(productId);
  if (!vs.length) return { min: 0, max: 0 };
  const displayPrices = vs.map((v) => (v.discount_price ?? v.price) || 0);
  return { min: Math.min(...displayPrices), max: Math.max(...displayPrices) };
}

/* ===================== PAGE ===================== */
export default function ProductManagement() {
  // ---- State layout ----
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-list");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // ---- State bộ lọc/bảng ----
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // published/hidden/all
  const [showCatDD, setShowCatDD] = useState(false);
  const [showStatusDD, setShowStatusDD] = useState(false);

  // ---- Dữ liệu hiển thị ----
  const [data, setData] = useState([]);

  // ---- State cho thao tác (xem/sửa/xoá) ----
  const [selected, setSelected] = useState(null);

  // Mock fetch & tính toán
  useEffect(() => {
    const enriched = PRODUCTS.map((p) => {
      const brand = joinBrand(p);
      const stock = aggregateStock(p.id);
      const pr = priceRange(p.id);
      const cats = categoryNames(p);
      return {
        ...p,
        brand,
        categories: cats, // mảng tên danh mục
        picture: mainPicture(p.id), // ảnh đại diện
        stock_on_hand: stock, // tổng tồn kho (từ inventory_item)
        price_min: pr.min, // range giá theo variants
        price_max: pr.max,
        sku_count: variantsOf(p.id).length,
      };
    });
    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setData(enriched);
  }, []);

  // Lọc
  const filtered = useMemo(() => {
    return data.filter((p) => {
      const bySearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      const byCat =
        categoryFilter === "all" || p.categories.includes(categoryFilter);
      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.is_published) ||
        (statusFilter === "hidden" && !p.is_published);
      return bySearch && byCat && byStatus;
    });
  }, [data, search, categoryFilter, statusFilter]);

  // ===== Handlers (ở TRONG component) =====
  function onView(p) {
    setSelected(p);
    alert(`Xem nhanh: ${p.name} (${p.code})`);
  }
  function onEdit(p) {
    setSelected(p);
    alert(`Sửa (mock): ${p.name}`);
  }
  function onDelete(p) {
    if (confirm(`Xoá sản phẩm "${p.name}"?`)) {
      setData((prev) => prev.filter((x) => x.id !== p.id));
    }
  }
  function togglePublish(p) {
    setData((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, is_published: !x.is_published } : x
      )
    );
  }

  return (
    <div className="d-flex vh-100 bg-light text-dark">
      <Sidebar
        collapsed={sidebarCollapsed}
        activeMenu={activeMenu}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onSelectMenu={setActiveMenu}
        notificationCount={3}
        showUserDropdown={showUserDropdown}
        toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
      />

      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <HeaderAdmin
          title="Quản lí sản phẩm"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((v) => !v)}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
        />

        <main className="flex-grow-1 overflow-auto bg-light p-4">
          {/* Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            {/* Search */}
            <div className="input-group" style={{ maxWidth: 360 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search text-muted" />
              </span>
              <input
                className="form-control border-start-0"
                placeholder="Tìm theo tên hoặc mã sản phẩm…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="d-flex flex-wrap gap-3">
              {/* Lọc danh mục theo TÊN */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  onClick={() => {
                    setShowCatDD((v) => !v);
                    setShowStatusDD(false);
                  }}
                >
                  {categoryFilter === "all"
                    ? "Tất cả danh mục"
                    : categoryFilter}
                </button>
                {showCatDD && (
                  <ul className="dropdown-menu show">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setCategoryFilter("all");
                          setShowCatDD(false);
                        }}
                      >
                        Tất cả danh mục
                      </button>
                    </li>
                    {[...new Set(data.flatMap((p) => p.categories))].map(
                      (name) => (
                        <li key={name}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setCategoryFilter(name);
                              setShowCatDD(false);
                            }}
                          >
                            {name}
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>

              {/* Lọc trạng thái publish */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  onClick={() => {
                    setShowStatusDD((v) => !v);
                    setShowCatDD(false);
                  }}
                >
                  {statusFilter === "all"
                    ? "Tất cả trạng thái"
                    : statusFilter === "published"
                    ? "Published"
                    : "Hidden"}
                </button>
                {showStatusDD && (
                  <ul className="dropdown-menu show">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowStatusDD(false);
                        }}
                      >
                        Tất cả trạng thái
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setStatusFilter("published");
                          setShowStatusDD(false);
                        }}
                      >
                        Published
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setStatusFilter("hidden");
                          setShowStatusDD(false);
                        }}
                      >
                        Hidden
                      </button>
                    </li>
                  </ul>
                )}
              </div>

              <button
                className="btn text-dark"
                style={{ backgroundColor: "#ede734" }}
              >
                <i className="fas fa-plus me-2"></i> Thêm Sản phẩm
              </button>
            </div>
          </div>

          {/* Bảng */}
          <div
            className="shadow rounded overflow-hidden w-100"
            id="product-list-card"
          >
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách sản phẩm</h3>
            </div>

            <div className="table-responsive">
              <table
                className="table mb-0"
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                </colgroup>

                <thead>
                  <tr className="border-bottom small text-secondary text-uppercase">
                    <th className="ps-4 py-3 text-start">Sản phẩm</th>
                    <th className="py-3 text-start">Danh mục</th>
                    <th className="py-3 text-center">Kho</th>
                    <th className="py-3 text-center">SKU</th>
                    <th className="py-3 text-center">Đã bán</th>
                    <th className="py-3 text-start">Trạng thái</th>
                    <th className="py-3 text-start">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-bottom align-middle">
                      {/* Sản phẩm */}
                      <td className="ps-4 py-3">
                        <div
                          className="d-flex align-items-center"
                          style={{ minWidth: 0 }}
                        >
                          <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                            <img
                              src={p.picture}
                              alt={p.name}
                              className="rounded"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div className="ms-3" style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-dark text-truncate"
                              title={p.name}
                            >
                              {p.name}
                            </div>
                            <div
                              className="small text-muted text-truncate"
                              title={`${p.code} • ${p.brand?.name ?? ""}`}
                            >
                              {p.code} • {p.brand?.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td className="py-3 small text-secondary">
                        <div
                          className="text-truncate"
                          title={p.categories.join(", ")}
                        >
                          {p.categories.join(", ")}
                        </div>
                      </td>

                      {/* Kho */}
                      <td className="py-3 text-center small text-secondary">
                        {p.stock_on_hand}
                      </td>

                      {/* SKU count */}
                      <td className="py-3 text-center small text-secondary">
                        {p.sku_count}
                      </td>

                      
                      {/* Sold */}
                      <td className="py-3 text-center small text-secondary">
                        {p.total_sold}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3">
                        <span
                          className={`badge ${
                            p.is_published ? "bg-success" : "bg-secondary"
                          } bg-opacity-10 px-2 py-1`}
                        >
                          <span
                            className={
                              p.is_published ? "text-success" : "text-secondary"
                            }
                          >
                            {p.is_published ? "Published" : "Hidden"}
                          </span>
                        </span>
                        <span className="ms-2 small text-muted">
                          ★ {p.average_rating?.toFixed(1) ?? "0"} /{" "}
                          {p.total_reviews}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="btn btn-link p-0 text-primary"
                            title="Xem"
                            onClick={() => onView(p)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-link p-0 text-secondary"
                            title="Sửa"
                            onClick={() => onEdit(p)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-link p-0 text-danger"
                            title="Xoá"
                            onClick={() => onDelete(p)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>

                          {/* Toggle publish/hidden */}
                          <div
                            className="form-check form-switch ms-2"
                            title={
                              p.is_published
                                ? "Ẩn sản phẩm"
                                : "Hiển thị sản phẩm"
                            }
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={p.is_published}
                              onChange={() => togglePublish(p)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      {/* colSpan = số cột header (8) */}
                      <td className="ps-4 py-4 text-muted" colSpan={7}>
                        Không có sản phẩm phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <style>{`
            #product-list-card{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important}
          `}</style>
        </main>
      </div>
    </div>
  );
}
