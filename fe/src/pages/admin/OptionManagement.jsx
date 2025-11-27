// src/pages/admin/OptionManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

function OptionManagement() {
  const navigate = useNavigate();

  // ---- Sidebar/header ----
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("product-options");
  const [notificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(v => !v);
  const toggleUserDropdown = () => setShowUserDropdown(v => !v);

  // ---- Data ----
  const [items, setItems] = useState([]); // từ API
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/product-options", { method: "GET" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không load được danh sách option.");
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi load list option:", err);
      alert("Không load được danh sách option: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(o) {
    if (!window.confirm(`Bạn chắc chắn muốn xoá option "${o.name}"?`)) return;

    try {
      const res = await apiFetch(`/api/admin/product-options/${o.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không xoá được option.");
      }
      alert("Đã xoá option.");
      loadData();
    } catch (err) {
      console.error("Lỗi xoá option:", err);
      alert("Lỗi xoá option: " + err.message);
    }
  }

  function gotoCreate() {
    navigate("/product-management/options/create", {
      state: { mode: "create" },
    });
  }

  function gotoEdit(id) {
    navigate("/product-management/options/create", {
      state: { mode: "edit", optionId: id },
    });
  }

  const filtered = items.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hitName = o.name?.toLowerCase().includes(q);
    const values = Array.isArray(o.values) ? o.values : [];
    const hitValue = values.some(v => v.toLowerCase().includes(q));
    return hitName || hitValue;
  });

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
          title="Quản lí option"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        <main className="flex-grow-1 overflow-auto bg-light p-4">
          {/* Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div className="input-group" style={{ maxWidth: 360 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search text-muted" />
              </span>
              <input
                className="form-control border-start-0"
                placeholder="Tìm theo tên option hoặc giá trị…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="d-flex flex-wrap gap-3">
              <button
                type="button"
                className="btn text-dark"
                style={{ backgroundColor: "#ede734" }}
                onClick={gotoCreate}
              >
                <i className="fas fa-plus me-2"></i> Thêm option
              </button>
            </div>
          </div>

          {/* Bảng */}
          <div className="shadow rounded overflow-hidden w-100" id="option-list-card">
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách nhóm option</h3>
            </div>

            {loading && (
              <div className="p-3 text-muted">Đang tải dữ liệu...</div>
            )}

            {!loading && !filtered.length && (
              <div className="p-3 text-muted">
                Không có nhóm option phù hợp. Nhấn <b>Thêm option</b>.
              </div>
            )}

            {!loading && !!filtered.length && (
              <div className="table-responsive">
                <table className="table mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "36%" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>

                  <thead>
                    <tr className="border-bottom small text-secondary text-uppercase">
                      <th className="ps-4 py-3 text-start">Option</th>
                      <th className="py-3 text-center">Số giá trị</th>
                      <th className="py-3 text-start">Giá trị</th>
                      <th className="py-3 text-start">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id} className="border-bottom align-middle">
                        <td className="ps-4 py-3">
                          <div className="fw-semibold text-dark">{o.name}</div>
                          <div className="small text-muted">
                            Đang dùng trong <b>{o.sku_used ?? 0}</b> SKU
                          </div>
                        </td>
                        <td className="py-3 text-center small text-secondary">
                          {o.value_count ?? (Array.isArray(o.values) ? o.values.length : 0)}
                        </td>
                        <td className="py-3">
                          <div className="d-flex flex-wrap gap-2">
                            {Array.isArray(o.values) && o.values.length ? (
                              o.values.map((val, idx) => (
                                <span
                                  key={idx}
                                  className="badge bg-secondary bg-opacity-10 text-secondary"
                                >
                                  {val}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted small">Chưa có giá trị</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-link p-0 text-secondary"
                              title="Sửa option"
                              onClick={() => gotoEdit(o.id)}
                            >
                              <i className="fas fa-edit"></i> Sửa
                            </button>
                            <button
                              className="btn btn-link p-0 text-danger"
                              title="Xoá option"
                              onClick={() => handleDelete(o)}
                            >
                              <i className="fas fa-trash-alt"></i> Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <style>{`
            #option-list-card{
              width:100%!important;
              max-width:100%!important;
              margin-left:0!important;
              margin-right:0!important;
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}

export default OptionManagement;
