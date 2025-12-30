// src/pages/admin/InventoryDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import HeaderAdmin from "../../components/admin/HeaderAdmin";
import { apiFetch } from "../../api/client";

export default function InventoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-inventory");
  const [notificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleUserDropdown = () => setShowUserDropdown((v) => !v);

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  function formatDate(d) {
    if (!d) return "";
    return String(d).substring(0, 10);
  }

  function formatDateTime(d) {
    if (!d) return "";
    return String(d).replace("T", " ").replace("Z", "");
  }

  function formatMoney(v) {
    if (v == null) return "0 ₫";
    try {
      return Number(v).toLocaleString("vi-VN") + " ₫";
    } catch {
      return String(v) + " ₫";
    }
  }

  function calcTotals(items = []) {
    let totalQty = 0;
    let totalAmount = 0;
    items.forEach((it) => {
      const q = it.quantity ?? 0;
      const lineAmount = it.lineAmount ?? 0;
      totalQty += q;
      totalAmount += Number(lineAmount);
    });
    return { totalQty, totalAmount };
  }

  async function loadDetail() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/purchase-receipts/${id}`, {
        method: "GET",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không load được chi tiết phiếu nhập.");
      }

      const data = await res.json();
      setReceipt(data);
    } catch (err) {
      console.error("Lỗi load chi tiết phiếu nhập:", err);
      alert("Không load được chi tiết phiếu nhập: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  const items = receipt?.items || [];
  const { totalQty, totalAmount } = calcTotals(items);

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
          title="Chi tiết phiếu nhập kho"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        <main className="flex-grow-1 overflow-auto p-4 bg-light">
          <div className="container-fluid px-0" style={{ maxWidth: "100%" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/product-management/inventory")}
              >
                <i className="fas fa-arrow-left me-2" />
                Quay lại danh sách
              </button>

              {receipt && (
                <div className="text-end small text-muted">
                  ID: <code>{receipt.id}</code>
                </div>
              )}
            </div>

            {loading && (
              <div className="alert alert-info">Đang tải chi tiết phiếu nhập...</div>
            )}

            {!loading && !receipt && (
              <div className="alert alert-warning">Không tìm thấy phiếu nhập.</div>
            )}

            {!loading && receipt && (
              <>
                {/* 1) Thông tin phiếu nhập */}
                <div className="card shadow-sm mb-4 w-100" style={{ maxWidth: "none" }}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <strong>1) Thông tin phiếu nhập</strong>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                      Đã tạo lúc: {formatDateTime(receipt.createdAt)}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="mb-2">
                          <div className="text-muted small">Mã phiếu</div>
                          <div className="fw-semibold fs-5">{receipt.code || "-"}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Ngày nhập</div>
                          <div className="fw-semibold">{formatDate(receipt.importDate)}</div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-2">
                          <div className="text-muted small">Nhà cung cấp</div>
                          <div className="fw-semibold">{receipt.supplierName || "-"}</div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-2">
                          <div className="text-muted small">Tổng số dòng</div>
                          <div className="fw-semibold">{items.length ?? 0}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Tổng SL nhập</div>
                          <div className="fw-semibold">{totalQty}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-muted small">Tổng giá trị nhập</div>
                          <div className="fw-semibold text-primary">
                            {formatMoney(totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2) Danh sách dòng / lô nhập */}
                <div className="card shadow-sm w-100" style={{ maxWidth: "none" }}>
                  <div className="card-header bg-white">
                    <strong>2) Danh sách dòng phiếu nhập</strong>
                  </div>

                  <div className="card-body p-0">
                    {!items.length && (
                      <div className="p-3 text-muted">Phiếu nhập này chưa có dòng nào.</div>
                    )}

                    {!!items.length && (
                      <div className="table-responsive">
                        <table className="table mb-0">
                          <thead className="small text-secondary text-uppercase">
                            <tr>
                              <th className="ps-4">SKU / Biến thể</th>
                              <th>Tên biến thể</th>
                              <th className="text-end" style={{ width: "10%" }}>SL nhập</th>
                              <th className="text-end" style={{ width: "12%" }}>SL còn lại</th>
                              <th className="text-end" style={{ width: "16%" }}>Giá nhập</th>
                              <th className="text-end" style={{ width: "18%" }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it) => (
                              <tr key={it.id}>
                                <td className="ps-4">
                                  <div className="fw-semibold">{it.variantSku}</div>
                                  <div className="small text-muted">ID: {it.variantId}</div>
                                </td>
                                <td><div className="fw-semibold">{it.variantName}</div></td>
                                <td className="text-end">{it.quantity ?? 0}</td>
                                <td className="text-end">{it.quantityRemaining ?? 0}</td>
                                <td className="text-end">{formatMoney(it.importPrice)}</td>
                                <td className="text-end">{formatMoney(it.lineAmount)}</td>
                              </tr>
                            ))}
                          </tbody>

                          <tfoot>
                            <tr className="fw-semibold">
                              <td className="ps-4" colSpan={2}>Tổng cộng</td>
                              <td className="text-end">{totalQty}</td>
                              <td className="text-end">—</td>
                              <td className="text-end">—</td>
                              <td className="text-end">{formatMoney(totalAmount)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
