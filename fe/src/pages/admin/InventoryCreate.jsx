// src/pages/admin/InventoryCreate.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import HeaderAdmin from "../../components/admin/HeaderAdmin";
import { apiFetch } from "../../api/client";
import Select from "react-select";
export default function InventoryCreate() {
  const navigate = useNavigate();

  // Sidebar / header
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-inventory");
  const [notificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleUserDropdown = () => setShowUserDropdown((v) => !v);

  // Form
  const [supplierName, setSupplierName] = useState("");
  const [importDate, setImportDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([
    { id: 1, variant_id: "", quantity: 1, import_price: "" },
  ]);

  const [saving, setSaving] = useState(false);

  // Danh sách biến thể để đổ dropdown
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // ===== LOAD VARIANTS DROPDOWN =====
  async function loadVariants() {
    try {
      setLoadingVariants(true);
      const res = await apiFetch("/api/admin/variants/dropdown", {
        method: "GET",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không load được danh sách biến thể.");
      }

      const data = await res.json();
      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi load variants dropdown:", err);
      alert("Không load được danh sách biến thể: " + err.message);
    } finally {
      setLoadingVariants(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, []);

  // ===== HÀNG LÔ =====
  function addRow() {
    const maxId = items.reduce((m, it) => Math.max(m, it.id), 0);
    setItems([
      ...items,
      { id: maxId + 1, variant_id: "", quantity: 1, import_price: "" },
    ]);
  }

  function updateRow(id, key, value) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    );
  }

  function removeRow(id) {
    if (items.length === 1) {
      alert("Cần ít nhất 1 dòng phiếu nhập");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // ===== SUBMIT =====
  async function onSave() {
    if (!supplierName.trim()) {
      alert("Nhà cung cấp không được để trống");
      return;
    }
    if (!importDate) {
      alert("Ngày nhập không được để trống");
      return;
    }

    const payload = {
      code: null, // BE tự tạo mã PN
      supplier_name: supplierName.trim(),
      import_date: importDate,
      note,
      items: items
        .filter(
          (it) => it.variant_id && it.quantity > 0 && it.import_price !== "",
        )
        .map((it) => ({
          variant_id: it.variant_id,
          quantity: Number(it.quantity),
          import_price: Number(it.import_price),
        })),
    };

    if (payload.items.length === 0) {
      alert("Cần ít nhất 1 dòng nhập hàng hợp lệ");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch("/api/admin/purchase-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không tạo được phiếu nhập");
      }

      alert("Tạo phiếu nhập thành công!");
      navigate("/product-management/inventory");
    } catch (err) {
      console.error("Lỗi tạo phiếu nhập:", err);
      alert("Lỗi: " + err.message);
    } finally {
      setSaving(false);
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
          title="Tạo phiếu nhập kho"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        <main className="flex-grow-1 overflow-auto p-4 bg-light">
          {/* 1) Thông tin phiếu nhập */}
          <div
            className="card shadow-sm mb-4 w-100"
            style={{ maxWidth: "none" }}
          >
            <div className="card-header bg-white">
              <strong>1) Thông tin phiếu nhập</strong>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-4">
                  <label className="form-label">Nhà cung cấp *</label>
                  <input
                    className="form-control"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="col-lg-3">
                  <label className="form-label">Ngày nhập *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="col-lg-12">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={saving}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* 2) Danh sách lô nhập */}
          <div className="card shadow-sm w-100" style={{ maxWidth: "none" }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>2) Danh sách lô nhập</strong>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={addRow}
                disabled={saving}
              >
                <i className="fas fa-plus me-2"></i> Thêm dòng
              </button>
            </div>

            <div className="card-body p-0">
              {loadingVariants && (
                <div className="p-3 text-muted">
                  Đang tải danh sách biến thể...
                </div>
              )}

              {!loadingVariants && !variants.length && (
                <div className="p-3 text-muted">
                  Chưa có biến thể nào (SKU). Hãy tạo sản phẩm & biến thể trước.
                </div>
              )}

              <table className="table mb-0">
                <thead className="small text-secondary text-uppercase">
                  <tr>
                    <th className="ps-4">Biến thể (SKU) *</th>
                    <th style={{ width: "15%" }}>Số lượng</th>
                    <th style={{ width: "20%" }}>Giá nhập</th>
                    <th className="text-end pe-4">Xoá</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="ps-4">
                        <Select
                          isClearable
                          isSearchable
                          isDisabled={saving || loadingVariants}
                          options={variants.map((v) => ({
                            value: v.id,
                            label: `${v.productName} — ${v.variantName}`,
                          }))}
                          onChange={(opt) =>
                            updateRow(it.id, "variant_id", opt ? opt.value : "")
                          }
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({
                              ...base,
                              zIndex: 9999,
                            }),
                            menu: (base) => ({
                              ...base,
                              maxHeight: 240,
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: 240,
                            }),
                          }}
                        />

                        <div className="form-text small text-muted">
                          Hiển thị: SKU • Tên sản phẩm • Cấu hình/biến thể.
                        </div>
                      </td>

                      <td>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            updateRow(it.id, "quantity", e.target.value)
                          }
                          disabled={saving}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={it.import_price}
                          onChange={(e) =>
                            updateRow(it.id, "import_price", e.target.value)
                          }
                          disabled={saving}
                        />
                      </td>

                      <td className="text-end pe-4">
                        <button
                          className="btn btn-link text-danger"
                          onClick={() => removeRow(it.id)}
                          disabled={saving}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="d-flex justify-content-end mt-4 gap-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/product-management/inventory")}
              disabled={saving}
            >
              Huỷ
            </button>

            <button
              className="btn btn-dark"
              onClick={onSave}
              disabled={saving || loadingVariants}
            >
              {saving ? "Đang lưu..." : "Lưu phiếu nhập"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
