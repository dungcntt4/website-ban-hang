// src/pages/admin/InventoryManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

function InventoryManagement() {
  const navigate = useNavigate();

  // Sidebar/header
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-inventory");
  const [notificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleUserDropdown = () => setShowUserDropdown((v) => !v);

  // Data: danh sách phiếu nhập
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      // 👉 API list phiếu nhập
      const res = await apiFetch("/api/admin/purchase-receipts", {
        method: "GET",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không load được danh sách phiếu nhập.");
      }
      const data = await res.json();
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi load list purchase receipts:", err);
      alert("Không load được danh sách phiếu nhập: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // search theo mã phiếu / nhà cung cấp
  const filtered = receipts.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const code = (r.code || "").toLowerCase();
    const supplier = (r.supplierName || "").toLowerCase();

    return code.includes(q) || supplier.includes(q);
  });

  function formatDate(iso) {
    if (!iso) return "";
    // trường importDate là LocalDate, createdAt là Instant → FE nhận string
    // cứ cắt yyyy-mm-dd cho gọn
    return String(iso).substring(0, 10);
  }

  function formatMoney(n) {
    if (n == null) return "0";
    try {
      return Number(n).toLocaleString("vi-VN") + " ₫";
    } catch {
      return String(n);
    }
  }

  return (
    <div className="d-flex vh-100 bg-light text-dark">
      <Sidebar
        collapsed={sidebarCollapsed}
        activeMenu={activeMenu}
        onToggle={toggleSidebar}
        onSelectMenu={setActiveMenu}
        notificationCount={notificationCount}
        showUserDropdown={showUserDropdown}
        toggleUserDropdown={toggleUserDropdown}
      />

      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <HeaderAdmin
          title="Quản lí nhập kho"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        <main className="flex-grow-1 overflow-auto bg-light p-4">
          {/* Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div className="input-group" style={{ maxWidth: 420 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search text-muted" />
              </span>
              <input
                className="form-control border-start-0"
                placeholder="Tìm theo mã phiếu hoặc nhà cung cấp…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="d-flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={loadData}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                Làm mới
              </button>

              {/* Nút tạo phiếu nhập */}
              <button
                type="button"
                className="btn text-dark"
                style={{ backgroundColor: "#ede734" }}
                onClick={() =>
                  navigate("/product-management/inventory/create")
                }
              >
                <i className="fas fa-plus me-2"></i> Tạo phiếu nhập
              </button>
            </div>
          </div>

          {/* Bảng phiếu nhập */}
          <div
            className="shadow rounded overflow-hidden w-100"
            id="inventory-list-card"
          >
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách phiếu nhập kho</h3>
            </div>

            {loading && (
              <div className="p-3 text-muted">Đang tải dữ liệu...</div>
            )}

            {!loading && !filtered.length && (
              <div className="p-3 text-muted">
                Không có phiếu nhập nào. Nhấn <b>Tạo phiếu nhập</b>.
              </div>
            )}

            {!loading && !!filtered.length && (
              <div className="table-responsive">
                <table
                  className="table mb-0"
                  style={{ tableLayout: "fixed", width: "100%" }}
                >
                  <colgroup>
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>

                  <thead>
                    <tr className="border-bottom small text-secondary text-uppercase">
                      <th className="ps-4 py-3 text-start">Mã phiếu</th>
                      <th className="py-3 text-start">Nhà cung cấp</th>
                      <th className="py-3 text-start">Ngày nhập</th>
                      <th className="py-3 text-end">Số dòng</th>
                      <th className="py-3 text-end">Tổng SL</th>
                      <th className="py-3 text-end">Tổng tiền</th>
                      <th className="py-3 text-center">#</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => {
                      return (
                        <tr
                          key={r.id}
                          className="border-bottom align-middle"
                        >
                          <td className="ps-4 py-3">
                            <div className="fw-semibold text-dark">
                              {r.code}
                            </div>
                            <div className="small text-muted">
                              Tạo lúc: {formatDate(r.createdAt)}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="fw-semibold text-dark">
                              {r.supplierName || "-"}
                            </div>
                          </td>
                          <td className="py-3">
                            {formatDate(r.importDate)}
                          </td>
                          <td className="py-3 text-end">
                            {r.itemCount ?? 0}
                          </td>
                          <td className="py-3 text-end">
                            {r.totalQuantity ?? 0}
                          </td>
                          <td className="py-3 text-end">
                            {formatMoney(r.totalAmount)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-secondary"
                              onClick={() =>
                                navigate(
                                  `/product-management/inventory/${r.id}`
                                )
                              }
                            >
                              <i className="fas fa-eye me-1" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <style>{`
            #inventory-list-card {
              width: 100% !important;
              max-width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}

export default InventoryManagement;
