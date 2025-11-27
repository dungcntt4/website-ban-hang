// src/pages/admin/ProductManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

/*
  API /api/admin/products trả về (theo DTO ProductListItemResponse):

  [
    {
      id: "uuid",
      code: "ASUS-TUF-A15-2024",
      name: "ASUS TUF A15 2024",
      slug: "asus-tuf-a15-2024",
      brand: { id: "uuid-brand", name: "ASUS" },
      categories: ["Gaming", "Laptop"],
      thumbnailUrl: "https://...",
      published: true,
      totalSold: 120,
      totalReviews: 36,
      averageRating: 4.6,
      priceMin: 19990000.0,      // product.price_min
      salePriceMin: 17990000.0,  // product.sale_price_min
      stockOnHand: 19,           // SUM(inventory_item.stock_on_hand)
      skuCount: 3,               // COUNT(product_variant)
      createdAt: "2025-01-10T08:00:00Z",
      updatedAt: "2025-02-01T10:00:00Z"
    },
    ...
  ]
*/

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

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ---- Dữ liệu hiển thị từ API ----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ---- State cho thao tác (xem/sửa/xoá) ----
  const [selected, setSelected] = useState(null);

  // ===== Fetch dữ liệu từ BE =====
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setData([]);
      return;
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await apiFetch("/api/admin/products", {
          method: "GET",
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Fetch products failed");
        }

        const json = await res.json();

        const sorted = [...json].sort((a, b) => {
          const da = new Date(a.updatedAt || a.createdAt || 0);
          const db = new Date(b.updatedAt || b.createdAt || 0);
          return db - da;
        });

        setData(sorted);
      } catch (err) {
        console.error("Lỗi load danh sách sản phẩm:", err);
        setLoadError(err.message || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [authLoading, user]);

  // ===== Lọc dữ liệu theo search / category / status =====
  const filtered = useMemo(() => {
    return data.filter((p) => {
      const bySearch =
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(search.toLowerCase());

      const productCategories = Array.isArray(p.categories)
        ? p.categories
        : [];

      const byCat =
        categoryFilter === "all" || productCategories.includes(categoryFilter);

      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.published) ||
        (statusFilter === "hidden" && !p.published);

      return bySearch && byCat && byStatus;
    });
  }, [data, search, categoryFilter, statusFilter]);

  // Lấy list tên danh mục duy nhất để build filter dropdown
  const allCategoryNames = useMemo(() => {
    const set = new Set();
    data.forEach((p) => {
      (p.categories || []).forEach((name) => set.add(name));
    });
    return Array.from(set);
  }, [data]);

  // ===== Handlers =====
  function onView(p) {
    setSelected(p);
    navigate("/product-management/products/create", {
      state: { mode: "view", productId: p.id },
    });
  }

  function onEdit(p) {
    setSelected(p);
    navigate("/product-management/products/create", {
      state: { mode: "edit", productId: p.id },
    });
  }

async function onDelete(p) {
  if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) {
    return;
  }

  try {
    const res = await apiFetch(`/api/admin/products/${p.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Xoá sản phẩm thất bại");
    }

    // Nếu BE trả JSON có message/id thì đọc thêm cũng được, không bắt buộc
    // const data = await res.json();
    // console.log("Delete product:", data);

    // Xoá khỏi state FE
    setData((prev) => prev.filter((x) => x.id !== p.id));

    alert(`Đã xoá sản phẩm "${p.name}"`);
  } catch (err) {
    console.error("Lỗi khi xoá sản phẩm:", err);
    alert("Lỗi khi xoá sản phẩm: " + err.message);
  }
}


  function togglePublish(p) {
    // TODO: Gọi API PATCH/PUT để đổi published ở BE
    setData((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, published: !x.published } : x
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
                    {allCategoryNames.map((name) => (
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
                    ))}
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

              {/* Thêm sản phẩm */}
              <Link
                to="/product-management/products/create"
                state={{ mode: "create" }}
                className="btn text-dark"
                style={{ backgroundColor: "#ede734" }}
              >
                <i className="fas fa-plus me-2"></i> Thêm Sản phẩm
              </Link>
            </div>
          </div>

          {/* Error / Loading */}
          {loading && (
            <div className="mb-3 text-muted small">
              Đang tải danh sách sản phẩm...
            </div>
          )}
          {loadError && (
            <div className="mb-3 text-danger small">
              Lỗi tải danh sách: {loadError}
            </div>
          )}

          {/* Bảng */}
          <div
            className="shadow rounded overflow-hidden w-100"
            id="product-list-card"
          >
            <div className="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">Danh sách sản phẩm</h3>
              <span className="small text-muted">
                Tổng: {filtered.length} sản phẩm
              </span>
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
                              src={
                                p.thumbnailUrl ||
                                "https://via.placeholder.com/80x80?text=IMG"
                              }
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

                            {/* Giá min / saleMin */}
                            {(p.priceMin != null ||
                              p.salePriceMin != null) && (
                              <div className="small mt-1">
                                {p.salePriceMin != null ? (
                                  <>
                                    <span className="fw-semibold text-danger">
                                      {Number(
                                        p.salePriceMin
                                      ).toLocaleString("vi-VN")}
                                      ₫
                                    </span>
                                    {p.priceMin != null && (
                                      <span className="text-muted text-decoration-line-through ms-1">
                                        {Number(
                                          p.priceMin
                                        ).toLocaleString("vi-VN")}
                                        ₫
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  p.priceMin != null && (
                                    <span className="fw-semibold">
                                      {Number(
                                        p.priceMin
                                      ).toLocaleString("vi-VN")}
                                      ₫
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td className="py-3 small text-secondary">
                        <div
                          className="text-truncate"
                          title={(p.categories || []).join(", ")}
                        >
                          {(p.categories || []).join(", ")}
                        </div>
                      </td>

                      {/* Kho */}
                      <td className="py-3 text-center small text-secondary">
                        {p.stockOnHand ?? 0}
                      </td>

                      {/* SKU count */}
                      <td className="py-3 text-center small text-secondary">
                        {p.skuCount ?? 0}
                      </td>

                      {/* Sold */}
                      <td className="py-3 text-center small text-secondary">
                        {p.totalSold ?? 0}
                      </td>

                      {/* Trạng thái + rating */}
                      <td className="py-3">
                        <span
                          className={`badge ${
                            p.published ? "bg-success" : "bg-secondary"
                          } bg-opacity-10 px-2 py-1`}
                        >
                          <span
                            className={
                              p.published ? "text-success" : "text-secondary"
                            }
                          >
                            {p.published ? "Published" : "Hidden"}
                          </span>
                        </span>
                        <span className="ms-2 small text-muted">
                          ★{" "}
                          {p.averageRating != null
                            ? Number(p.averageRating).toFixed(1)
                            : "0"}{" "}
                          / {p.totalReviews ?? 0}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && !loading && (
                    <tr>
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
            #product-list-card{
              width:100%!important;
              max-width:100%!important;
              margin-left:0!important;
              margin-right:0!important
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}
