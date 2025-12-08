import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import HeaderAdmin from "../../components/admin/HeaderAdmin";
import { apiFetch } from "../../api/client";

export default function InventoryCreate() {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-inventory");

  const [supplierName, setSupplierName] = useState("");
  const [importDate, setImportDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([
    { id: 1, variant_id: "", quantity: 1, import_price: "" },
  ]);

  const [saving, setSaving] = useState(false);

  // ---------------- ADD / UPDATE ROW -------------------
  function addRow() {
    const maxId = Math.max(...items.map(i => i.id), 0);
    setItems([...items, { id: maxId + 1, variant_id: "", quantity: 1, import_price: "" }]);
  }

  function updateRow(id, key, value) {
    setItems(items.map(it => it.id === id ? { ...it, [key]: value } : it));
  }

  function removeRow(id) {
    if (items.length === 1) {
      alert("Cần ít nhất 1 dòng!");
      return;
    }
    setItems(items.filter(it => it.id !== id));
  }

  // -------------------- SAVE ----------------------------
  async function onSave() {
    if (!supplierName.trim()) return alert("Nhà cung cấp không được để trống");
    if (!importDate) return alert("Ngày nhập không được để trống");

    const payload = {
      code: null, // BE tự tạo PNxxxx
      supplierName: supplierName.trim(),
      importDate,
      note,
      items: items
        .filter(it => it.variant_id && it.quantity > 0 && it.import_price)
        .map(it => ({
          variantId: it.variant_id,
          quantity: Number(it.quantity),
          importPrice: Number(it.import_price),
        })),
    };

    if (payload.items.length === 0) {
      alert("Cần ít nhất 1 dòng nhập hợp lệ");
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
        throw new Error(msg);
      }

      alert("Tạo phiếu nhập thành công!");
      navigate("/product-management/inventory");

    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // -------------------- UI ----------------------------
  return (
    <div className="d-flex vh-100 bg-light">
      <Sidebar collapsed={sidebarCollapsed} onSelectMenu={setActiveMenu} />

      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <HeaderAdmin
          title="Tạo phiếu nhập kho"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(v => !v)}
        />

        <main className="flex-grow-1 overflow-auto p-4 bg-light">

          {/* PHIẾU NHẬP */}
          <div className="card shadow-sm mb-4">
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
                  />
                </div>

                <div className="col-lg-3">
                  <label className="form-label">Ngày nhập *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                  />
                </div>

                <div className="col-lg-12">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* LÔ NHẬP */}
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>2) Danh sách lô nhập</strong>
              <button className="btn btn-sm btn-outline-secondary" onClick={addRow}>
                <i className="fas fa-plus me-2"></i> Thêm dòng
              </button>
            </div>

            <div className="card-body p-0">
              <table className="table mb-0">
                <thead className="small text-secondary text-uppercase">
                  <tr>
                    <th className="ps-4">Variant ID</th>
                    <th>Số lượng</th>
                    <th>Giá nhập</th>
                    <th className="text-end pe-4">Xoá</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="ps-4">
                        <input
                          className="form-control"
                          placeholder="Variant UUID"
                          value={it.variant_id}
                          onChange={(e) =>
                            updateRow(it.id, "variant_id", e.target.value)
                          }
                        />
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
                        />
                      </td>

                      <td className="text-end pe-4">
                        <button
                          className="btn btn-link text-danger"
                          onClick={() => removeRow(it.id)}
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
            >
              Huỷ
            </button>

            <button className="btn btn-dark" onClick={onSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu phiếu nhập"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
