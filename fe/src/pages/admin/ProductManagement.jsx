// src/pages/admin/ProductManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

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
  const [page, setPage] = useState(0); // 0-based
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  // ---- State cho thao tác (xem/sửa/xoá) ----
  const [selected, setSelected] = useState(null);
  const [categories, setCategories] = useState([]);

  // ===== Fetch dữ liệu từ BE =====
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function fetchProducts() {
      try {
        setLoading(true);
        setLoadError(null);

        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });

        if (search.trim()) params.append("search", search.trim());
        if (categoryFilter !== "all") {
          params.append("categoryId", categoryFilter);
        }

        if (statusFilter !== "all") params.append("status", statusFilter);
        // statusFilter đang là "published" | "hidden" | "all"

        const res = await apiFetch(`/api/admin/products?${params.toString()}`);

        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();

        setData(json.content || []);
        setTotalPages(json.totalPages || 0);
        setTotalElements(json.totalElements || 0);
      } catch (err) {
        setLoadError(err.message || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [authLoading, user, page, size, search, categoryFilter, statusFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, categoryFilter, statusFilter]);
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiFetch("/api/public/categories");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setCategories(json);
      } catch (e) {
        console.error("Load categories failed", e);
      }
    }
    fetchCategories();
  }, []);

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
      prev.map((x) => (x.id === p.id ? { ...x, published: !x.published } : x))
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
                    : categories.find((c) => c.id === categoryFilter)?.name}
                </button>

                {showCatDD && (
                  <ul
                    className="dropdown-menu show"
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      minWidth: "220px",
                    }}
                  >
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

                    {categories.map((c) => (
                      <li key={c.id}>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setCategoryFilter(c.id); // ✅ UUID
                            setShowCatDD(false);
                          }}
                        >
                          {c.name}
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
          {/* Bảng */}
          <div
            className="shadow rounded overflow-hidden w-100"
            id="product-list-card"
          >
            <div className="card-header bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">Danh sách sản phẩm</h3>
              <span className="small text-muted">
                Tổng: {totalElements} sản phẩm
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
                    <th className="py-3 text-center">SL còn lại</th>
                    <th className="py-3 text-center">SKU</th>
                    <th className="py-3 text-center">Đã bán</th>
                    <th className="py-3 text-start">Trạng thái</th>
                    <th className="py-3 text-start">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((p) => (
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
                              title={`${p.code} • ${p.brandName}`}
                            >
                              {p.code} • {p.brandName}
                            </div>

                            {/* Giá min / saleMin */}
                            {(p.priceMin != null || p.salePriceMin != null) && (
                              <div className="small mt-1">
                                {p.salePriceMin != null ? (
                                  <>
                                    <span className="fw-semibold text-danger">
                                      {Number(p.salePriceMin).toLocaleString(
                                        "vi-VN"
                                      )}
                                      ₫
                                    </span>
                                    {p.priceMin != null && (
                                      <span className="text-muted text-decoration-line-through ms-1">
                                        {Number(p.priceMin).toLocaleString(
                                          "vi-VN"
                                        )}
                                        ₫
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  p.priceMin != null && (
                                    <span className="fw-semibold">
                                      {Number(p.priceMin).toLocaleString(
                                        "vi-VN"
                                      )}
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
                      <td className="py-3">
                        <div
                          className="d-flex flex-wrap gap-1"
                          title={(p.categories || [])
                            .map((c) => c.name)
                            .join(", ")}
                        >
                          {(p.categories || []).slice(0, 2).map((c) => (
                            <span
                              key={c.id}
                              className="badge bg-light text-dark border"
                              style={{ fontWeight: 400 }}
                            >
                              {c.name}
                            </span>
                          ))}

                          {(p.categories || []).length > 2 && (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              +{p.categories.length - 2}
                            </span>
                          )}
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
                        <div>
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
                        </div>

                        <div className="small text-muted mt-1">
                          ★ {Number(p.averageRating || 0).toFixed(1)} /{" "}
                          {p.totalReviews ?? 0}
                        </div>
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
                  {!totalElements && !loading && (
                    <tr>
                      <td className="ps-4 py-4 text-muted" colSpan={7}>
                        Không có sản phẩm phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 d-flex justify-content-end">
              <nav aria-label="Page navigation">
                <ul
                  className="pagination"
                  style={{ marginTop: 0, marginRight: 35 }}
                >
                  <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <li
                      key={idx}
                      className={`page-item ${page === idx ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage(idx)}
                      >
                        {idx + 1}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      page >= totalPages - 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            <style>{`
                        .pagination {
                            margin-top: 3rem; /* tương đương mt-12 */
                          }
                          
                          .pagination .page-item {
                            margin: 0 0.25rem;
                          }
                          
                          .pagination .page-link {
                            padding: 0.5rem 0.75rem;         /* tương đương px-3 py-2 */
                            border-radius: 0.5rem;           /* rounded-lg */
                            border: 1px solid #d1d5db;       /* border-gray-300 */
                            color: #6b7280;                  /* text-gray-500 */
                            white-space: nowrap;             /* nowrap */
                            transition: background-color .2s;
                          }
                          
                          .pagination .page-link:hover {
                            background-color: #f9fafb;       /* hover:bg-gray-50 */
                          }
                          
                          .pagination .page-item.active .page-link {
                            background-color: #ede734;       /* bg-[#ede734] */
                            color: #000;                     /* text-black */
                            font-weight: 500;                /* font-medium */
                            border-color: #ede734;
                          }
                          
                          .pagination .page-item.disabled .page-link {
                            color: #9ca3af;                  /* text-gray-400 */
                            pointer-events: none;
                            background: transparent;
                            border-color: #d1d5db;
                          }
                        `}</style>
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
