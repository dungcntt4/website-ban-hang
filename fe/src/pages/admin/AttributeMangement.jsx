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
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không load được danh sách thuộc tính.");
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi load list Spec Attribute:", err);
      alert("Không load được danh sách: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Bạn chắc chắn muốn xoá thuộc tính này?")) return;

    try {
      const res = await apiFetch(`/api/admin/spec-attributes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Không xoá được thuộc tính.");
      }
      alert("Đã xoá thuộc tính.");
      loadData();
    } catch (err) {
      console.error("Lỗi xoá Spec Attribute:", err);
      alert("Lỗi xoá thuộc tính: " + err.message);
    }
  }

  function gotoCreate() {
    navigate("/product-management/attributes/create", {
      state: { mode: "create" },
    });
  }

  function gotoEdit(id) {
    navigate("/product-management/attributes/create", {
      state: { mode: "edit", attributeId: id },
    });
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
          <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Danh sách Thuộc tính kỹ thuật</h5>
              <button className="btn btn-dark" onClick={gotoCreate}>
                <i className="fas fa-plus me-2" />
                Thêm thuộc tính
              </button>
            </div>

            <div className="card shadow-sm w-100" style={{ maxWidth: "none" }}>
              <div className="card-body p-0">
                {loading && (
                  <div className="p-3 text-muted">Đang tải dữ liệu...</div>
                )}
                {!loading && !items.length && (
                  <div className="p-3 text-muted">
                    Chưa có thuộc tính nào. Nhấn <b>Thêm thuộc tính</b>.
                  </div>
                )}

                {!!items.length && (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="small text-secondary text-uppercase">
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "35%" }}>Tên thuộc tính</th>
                          <th style={{ width: "40%" }}>Giá trị</th>
                          <th style={{ width: "20%" }} className="text-end">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} className="align-middle">
                            <td>{index + 1}</td>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>
                              {Array.isArray(item.values_preview) &&
                              item.values_preview.length ? (
                                <>
                                  {item.values_preview.join(", ")}
                                  {item.value_count > item.values_preview.length &&
                                    ` ... (+${item.value_count - item.values_preview.length})`}
                                </>
                              ) : (
                                <span className="text-muted">Chưa có giá trị.</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-secondary me-2"
                                onClick={() => gotoEdit(item.id)}
                              >
                                <i className="fas fa-edit me-1" />
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
                              >
                                <i className="fas fa-trash-alt me-1" />
                                Xoá
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AttributeManagement;
