import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

function AttributeManagement() {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("spec-attribute-list");
  const [notificationCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/spec-attributes", { method: "GET" });
      if (!res.ok) throw new Error((await res.text()) || "Không load được danh sách thuộc tính.");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Không load được danh sách: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Bạn chắc chắn muốn xoá thuộc tính "${name}"?`)) return;
    try {
      const res = await apiFetch(`/api/admin/spec-attributes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.text()) || "Không xoá được thuộc tính.");
      alert("Đã xoá thuộc tính.");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Lỗi xoá thuộc tính: " + err.message);
    }
  }

  function gotoCreate() {
    navigate("/product-management/attributes/create", { state: { mode: "create" } });
  }

  function gotoEdit(id) {
    navigate("/product-management/attributes/create", { state: { mode: "edit", attributeId: id } });
  }

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
          title="Thuộc tính kỹ thuật"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((v) => !v)}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={() => setShowUserDropdown((v) => !v)}
        />

        <main className="flex-grow-1 overflow-auto bg-light p-3">
          {/* Toolbar giống OptionManagement */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <h5 className="mb-0">Danh sách Thuộc tính kỹ thuật</h5>

            <button className="btn btn-dark" onClick={gotoCreate}>
              <i className="fas fa-plus me-2" />
              Thêm thuộc tính
            </button>
          </div>

          {/* Card/bảng giống OptionManagement */}
          <div className="shadow rounded overflow-hidden w-100" id="attr-list-card">
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách Thuộc tính kỹ thuật</h3>
            </div>

            {loading && <div className="p-3 text-muted">Đang tải dữ liệu...</div>}

            {!loading && !items.length && (
              <div className="p-3 text-muted">
                Chưa có thuộc tính nào. Nhấn <b>Thêm thuộc tính</b>.
              </div>
            )}

            {!loading && !!items.length && (
              <div className="table-responsive">
                <table className="table mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "32%" }} />
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>

                  <thead>
                    <tr className="border-bottom small text-secondary text-uppercase">
                      <th className="ps-4 py-3 text-start">#</th>
                      <th className="py-3 text-start">Tên thuộc tính</th>
                      <th className="py-3 text-start">Giá trị</th>
                      <th className="py-3 text-start">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-bottom align-middle">
                        <td className="ps-4 py-3">{index + 1}</td>

                        <td className="py-3">
                          <div className="fw-semibold text-dark">{item.name}</div>
                        </td>

                        <td className="py-3">
                          <div className="d-flex flex-wrap gap-2">
                            {Array.isArray(item.values_preview) && item.values_preview.length ? (
                              item.values_preview.map((val, idx) => (
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

                            {item.value_count > (item.values_preview?.length || 0) && (
                              <span className="small text-muted">
                                ... (+{item.value_count - (item.values_preview?.length || 0)})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-link p-0 text-secondary"
                              onClick={() => gotoEdit(item.id)}
                              title="Sửa thuộc tính"
                            >
                              <i className="fas fa-edit"></i> Sửa
                            </button>

                            <button
                              className="btn btn-link p-0 text-danger"
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Xoá thuộc tính"
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
            #attr-list-card{
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

export default AttributeManagement;
