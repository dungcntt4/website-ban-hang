import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

/**
 * Trang tạo / sửa Thuộc tính kỹ thuật (Specification Attribute)
 * - mode = "create" | "edit" (nhận từ navigate(..., { state }))
 *   + create: không có attributeId
 *   + edit: có attributeId
 */
function SpecAttributeCreate() {
  // ---- mode & id ----
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: navMode, attributeId } = location.state || {};
  const mode = navMode || "create";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  // Sidebar/header
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("spec-attribute-create");
  const [notificationCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [values, setValues] = useState([{ id: 1, spec_value_text: "" }]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helpers
  function addRow() {
    const maxId = values.reduce((m, v) => Math.max(m, v.id), 0) || 0;
    setValues((prev) => [...prev, { id: maxId + 1, spec_value_text: "" }]);
  }
  function updateRow(id, text) {
    setValues((prev) =>
      prev.map((v) => (v.id === id ? { ...v, spec_value_text: text } : v))
    );
  }
  function removeRow(id) {
    setValues((prev) => prev.filter((v) => v.id !== id));
  }
  function normalizeValues(list) {
    const seen = new Set();
    const cleaned = [];
    for (const v of list) {
      const t = (v.spec_value_text || "").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push({ spec_value_text: t });
    }
    return cleaned;
  }
  function validate() {
    const errs = [];
    if (!name.trim()) errs.push("Tên thuộc tính là bắt buộc.");
    const cleaned = normalizeValues(values);
    if (cleaned.length === 0) errs.push("Cần ít nhất 1 giá trị cho thuộc tính.");
    return { errs, cleanedValues: cleaned };
  }

  // ===== LOAD DETAIL KHI EDIT =====
  useEffect(() => {
    if (!isEditMode || !attributeId) return;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await apiFetch(`/api/admin/spec-attributes/${attributeId}`, {
          method: "GET",
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Không load được chi tiết thuộc tính.");
        }

        const data = await res.json();
        setName(data.name || "");
        const vals = Array.isArray(data.values)
          ? data.values.map((v, idx) => ({
              id: idx + 1,
              spec_value_text: v.spec_value_text || "",
            }))
          : [{ id: 1, spec_value_text: "" }];

        setValues(vals.length ? vals : [{ id: 1, spec_value_text: "" }]);
      } catch (err) {
        console.error("Lỗi load chi tiết Spec Attribute:", err);
        alert("Không load được chi tiết thuộc tính: " + err.message);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [isEditMode, attributeId]);

  async function onSave() {
    const { errs, cleanedValues } = validate();
    if (errs.length) {
      alert("Vui lòng kiểm tra:\n- " + errs.join("\n- "));
      return;
    }

    const payload = {
      attribute: { name: name.trim() },
      values: cleanedValues,
    };

    try {
      setSaving(true);
      const url = isEditMode
        ? `/api/admin/spec-attributes/${attributeId}`
        : "/api/admin/spec-attributes";
      const method = isEditMode ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Lỗi khi lưu thuộc tính.");
      }

      alert(isEditMode ? "Cập nhật thuộc tính thành công!" : "Tạo thuộc tính thành công!");
      // quay lại list
      navigate("/product-management/attributes");
    } catch (err) {
      console.error("Lỗi khi lưu Spec Attribute:", err);
      alert("Lỗi khi lưu thuộc tính: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = isCreateMode ? "Tạo mới Thuộc tính kỹ thuật" : "Chỉnh sửa Thuộc tính kỹ thuật";
  const formDisabled = saving || loadingDetail;

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
          title={pageTitle}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((v) => !v)}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
        />

        {/* Bớt padding phải để hết khoảng trắng */}
        <main className="flex-grow-1 overflow-auto bg-light p-3 pe-0">
          <div className="container-fluid px-0 pe-0">
            {loadingDetail && isEditMode && (
              <div className="alert alert-info py-2">Đang tải chi tiết thuộc tính...</div>
            )}

            {/* ====== THÔNG TIN THUỘC TÍNH ====== */}
            <div className="card shadow-sm mb-4 w-100" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white">
                <strong>1) Thông tin thuộc tính</strong>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <label className="form-label">Tên thuộc tính *</label>
                    <input
                      className="form-control"
                      placeholder="VD: CPU / GPU / Màn hình / RAM / SSD..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={formDisabled}
                    />
                  </div>

                  <div className="col-12 col-lg-4 d-flex align-items-end">
                    <div className="alert alert-info w-100 mb-0 py-2 small">
                      Thuộc tính này sẽ xuất hiện ở phần <b>Thông số kỹ thuật</b> khi tạo sản phẩm.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ====== GIÁ TRỊ CỦA THUỘC TÍNH ====== */}
            <div className="card shadow-sm mb-4 w-100" style={{ maxWidth: "none" }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>2) Giá trị hiển thị</strong>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={addRow}
                  disabled={formDisabled}
                >
                  <i className="fas fa-plus me-2" />
                  Thêm giá trị
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table mb-0">
                    <colgroup>
                      <col style={{ width: "70%" }} />
                      <col style={{ width: "30%" }} />
                    </colgroup>
                    <thead>
                      <tr className="small text-secondary text-uppercase">
                        <th>Giá trị *</th>
                        <th className="text-end">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.map((v) => (
                        <tr key={v.id} className="align-middle">
                          <td>
                            <input
                              className="form-control"
                              placeholder='VD: "Ryzen 7 7840HS" / "15.6\" FHD 144Hz" / "16GB" ...'
                              value={v.spec_value_text}
                              onChange={(e) => updateRow(v.id, e.target.value)}
                              disabled={formDisabled}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-link text-danger"
                              onClick={() => removeRow(v.id)}
                              disabled={values.length === 1 || formDisabled}
                              title={
                                values.length === 1
                                  ? "Cần ít nhất 1 giá trị"
                                  : "Xoá"
                              }
                            >
                              <i className="fas fa-trash-alt" /> Xoá
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!values.length && (
                        <tr>
                          <td colSpan={2} className="text-muted py-3">
                            Chưa có giá trị nào. Nhấn <b>Thêm giá trị</b>.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="small text-muted mt-2">
                  * Mẹo: Bạn có thể thêm nhiều hàng và điền nhanh, hệ thống sẽ tự
                  loại trùng & bỏ trống khi lưu.
                </div>
              </div>
            </div>

            {/* ====== ACTIONS ====== */}
            <div className="d-flex justify-content-end gap-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
                disabled={saving}
              >
                Huỷ
              </button>
              <button
                className="btn btn-dark"
                onClick={onSave}
                disabled={saving || loadingDetail}
              >
                {saving
                  ? isEditMode
                    ? "Đang cập nhật..."
                    : "Đang lưu..."
                  : isEditMode
                  ? "Lưu thay đổi"
                  : "Lưu thuộc tính"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SpecAttributeCreate;
