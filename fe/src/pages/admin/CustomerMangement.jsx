import React, { useEffect, useState } from "react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";

function CustomerManagement() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("customermanagement");
  const [notificationCount, setNotificationCount] = useState(5);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);
  const [showDeleteModal, setshowDeleteModal] = useState(false);
  const [showDetailModal, setshowDetailModal] = useState(false);
  const [showAddModal, setshowAddModal] = useState(false);
  const [user, setUser] = useState({});
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggle user dropdown
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);
  const [newRole, setNewRole] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage - 1), // BE 0-based
        size: String(usersPerPage),
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const res = await apiFetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();

      setUsers(json.content || []);
      setTotalPages(json.totalPages || 0);
      setTotalElements(json.totalElements || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLock = async (userId) => {
     const targetUser = users.find((u) => u.id === userId);
  if (!targetUser || targetUser.role !== "ROLE_CUSTOMER") {
    setToastType("danger");
    setToastMessage("Chỉ được cập nhật tài khoản CUSTOMER");
    setShowToast(true);
    return;
  }
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/toggle-lock`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(await res.text());

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, locked: !u.locked } : u))
      );

      setToastType("success");
      setToastMessage("Cập nhật trạng thái thành công");
      setShowToast(true);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message);
      setShowToast(true);
    }
  };

  const handleDeleteUser = (userId) => {
    setSelectedUserId(userId);
    setshowDeleteModal(true);
  };
  const confirmDelete = async () => {
    const targetUser = users.find((u) => u.id === userId);
  if (!targetUser || targetUser.role !== "ROLE_CUSTOMER") {
    setToastType("danger");
    setToastMessage("Chỉ được cập nhật tài khoản CUSTOMER");
    setShowToast(true);
    return;
  }
    try {
      const res = await apiFetch(`/api/admin/users/${selectedUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());

      setToastType("success");
      setToastMessage("Xóa tài khoản thành công");
      setShowToast(true);
      setshowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message);
      setShowToast(true);
      setshowDeleteModal(false);
    }
  };

  const handleUpdateRole = (userId) => {
    setSelectedUserId(userId);
    setShowUpdateRoleModal(true);
  };

  const confirmUpdateRole = async () => {
    const targetUser = users.find((u) => u.id === selectedUserId);

  if (!targetUser || targetUser.role !== "ROLE_CUSTOMER") {
    setToastType("danger");
    setToastMessage("Chỉ được cập nhật tài khoản CUSTOMER");
    setShowToast(true);
    return;
  }
    try {
      const res = await apiFetch(`/api/admin/users/${selectedUserId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error(await res.text());

      setToastType("success");
      setToastMessage("Cập nhật quyền thành công");
      setShowToast(true);
      setShowUpdateRoleModal(false);
      fetchUsers();
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message);
      setShowToast(true);
      setShowUpdateRoleModal(false);
    }
  };

  const handleViewDetails = (user) => {
    setUser(user);
    setshowDetailModal(true);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000); // 3000ms = 3 giây, bạn có thể chỉnh số này

      return () => clearTimeout(timer); // Dọn dẹp nếu Toast tắt sớm
    }
  }, [showToast]);

  const handleCreateAccount = async () => {
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setToastType("success");
      setToastMessage("Tạo tài khoản thành công");
      setShowToast(true);
      setshowAddModal(false);
      fetchUsers();
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message);
      setShowToast(true);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <div className="d-flex vh-100 bg-light text-dark">
      {/* Gọi component Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        activeMenu={activeMenu}
        onToggle={toggleSidebar}
        onSelectMenu={setActiveMenu}
        notificationCount={notificationCount}
        showUserDropdown={showUserDropdown}
        toggleUserDropdown={toggleUserDropdown}
      />

      <div className="flex-grow-1 d-flex flex-column">
        <HeaderAdmin
          title="Quản lý khác hàng"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />
        <main className="flex-grow-1 overflow-auto bg-light py-4 px-2">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            {/* Search sản phẩm */}
            <div className="input-group" style={{ maxWidth: "300px" }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm theo email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filters & Add Button */}
            <div className="d-flex flex-wrap gap-3">
              {/* Add Product Button */}
              <button
                className="btn text-dark"
                style={{ backgroundColor: "#ede734" }}
                onClick={() => {
                  setshowAddModal(true);
                }}
              >
                <i className="fas fa-plus me-2"></i> Thêm tài khoản
              </button>
            </div>
          </div>
          <div
            className="card shadow rounded overflow-hidden w-100"
            style={{ maxWidth: "none" }}
          >
            {/* Header */}
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách khách hàng</h3>
              <span className="small text-muted">
                Tổng: {totalElements} khách hàng
              </span>
            </div>

            {/* Table container với scroll ngang tự động */}
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr className="border-bottom">
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Loại tài khoản
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap text-end"
                    >
                      Trạng thái hồ sơ
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Trạng thái
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap text-center"
                    >
                      Vai trò
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-bottom">
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap text-start">
                        <div className="d-flex align-items-center text-start">
                          <div
                            className="text-start"
                            style={{
                              maxWidth: "200px",
                              wordWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            <div className="small fw-medium text-dark text-start">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="ps-4 pe-4 py-3 align-middle text-secondary small text-nowrap  text-center">
                        {user.googleAccount ? (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Google
                          </span>
                        ) : (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Thường
                          </span>
                        )}
                      </td>

                      <td className="ps-4 pe-4 py-3 align-middle text-secondary small text-nowrap text-center">
                        {user.profileCompleted ? (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#d1fae5",
                              color: "#065f46",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#fef9c3",
                              color: "#92400e",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Chưa hoàn thành
                          </span>
                        )}
                      </td>

                      <td className="ps-4 pe-4 py-3 align-middle text-secondary small text-nowrap text-center">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={!user.locked} // Đang hoạt động thì checked
                            onChange={() => handleToggleLock(user.id)}
                          />
                          <label className="form-check-label">
                            {user.locked ? "Đã khóa" : "Hoạt động"}
                          </label>
                        </div>
                      </td>
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap text-center">
                        {user.role === "ROLE_ADMIN" ? (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#c7d2fe",
                              color: "#3730a3",
                            }}
                          >
                            ADMIN
                          </span>
                        ) : (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#e5e7eb",
                              color: "#374151",
                            }}
                          >
                            CUSTOMER
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="ps-2 pe-2 py-3 align-middle text-nowrap">
                        <div className="d-flex align-items-center">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="btn btn-link text-primary p-0 me-3"
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleUpdateRole(user.id)}
                            className="btn btn-link text-success p-0 me-3"
                            title="Cập nhật quyền"
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-link text-danger p-0 me-3"
                            title="Xóa"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer phân trang & thống kê */}
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
            <div className="mt-4 d-flex justify-content-end">
              <nav aria-label="Page navigation">
                <ul
                  className="pagination "
                  style={{ marginTop: "0", marginRight: "35px" }}
                >
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      style={{ outline: "none", boxShadow: "none" }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${
                        currentPage === index + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => {
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                          }
                        }}
                        style={{ outline: "none", boxShadow: "none" }}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      style={{ outline: "none", boxShadow: "none" }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </main>
      </div>

      {showUpdateRoleModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              zIndex: 1055,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title text-primary">Cập nhật quyền</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUpdateRoleModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <div className="position-relative">
                      <select
                        className="form-select"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      >
                        <option value="">-- Chọn quyền --</option>
                        <option value="ROLE_CUSTOMER">CUSTOMER</option>
                        <option value="ROLE_ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUpdateRoleModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      !newRole ? "btn-secondary disabled" : "btn-primary"
                    }`}
                    onClick={confirmUpdateRole}
                    disabled={!newRole}
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1050 }}
          ></div>
        </>
      )}
      {showDeleteModal && (
        <>
          {/* Backdrop trước */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
          ></div>

          {/* Modal */}
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              zIndex: 1055,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title text-danger">
                    Xác nhận xóa tài khoản
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setshowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Bạn có chắc chắn muốn xóa tài khoản này?</p>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setshowDeleteModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showDetailModal && (
        <div style={styles.overlay}>
          <div
            className="modal-content p-4 shadow rounded"
            style={{
              ...styles.modal,
              maxWidth: "500px",
              width: "100%",
              backgroundColor: "#fff",
            }}
          >
            <button
              onClick={() => setshowDetailModal(false)}
              style={styles.closeBtn}
              className="btn-close position-absolute"
            ></button>

            <h4 className="text-center mb-4">Thông Tin Chi Tiết Người Dùng</h4>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between">
                <strong>Họ và Tên:</strong>
                <span>{user?.fullName || "Chưa có thông tin"}</span>
              </div>
              <div className="d-flex justify-content-between">
                <strong>Email:</strong>
                <span>{user?.email}</span>
              </div>
              <div className="d-flex justify-content-between">
                <strong>Số điện thoại:</strong>
                <span>{user?.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="d-flex justify-content-between">
                <strong>Tổng số đơn hàng đã hoàn thành:</strong>
                <span>{user.totalOrders}</span>
              </div>
              <div className="d-flex justify-content-between">
                <strong>Tổng số tiền đã chi tiêu:</strong>
                <span>{user.totalSpent?.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>

            <div className="text-end mt-4">
              <button
                className="btn btn-secondary"
                onClick={() => setshowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={styles.overlay}>
          <div
            style={{ ...styles.modal, maxWidth: "500px" }}
            className="modal-content p-4"
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-primary mb-0">Tạo tài khoản mới</h5>
              <button
                onClick={() => setshowAddModal(false)}
                style={styles.closeBtn}
              >
                &times;
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${
                  newEmail && !validateEmail(newEmail) ? "is-invalid" : ""
                }`}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nhập email"
                autoComplete="off"
              />
              {newEmail && !validateEmail(newEmail) && (
                <div className="invalid-feedback">Email không hợp lệ</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                autoComplete="new-password"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Nhập lại mật khẩu</label>
              <input
                type="password"
                className={`form-control ${
                  newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword
                    ? "is-invalid"
                    : ""
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <div className="invalid-feedback">
                    Mật khẩu nhập lại không khớp
                  </div>
                )}
            </div>

            <div className="mb-3">
              <label className="form-label">Vai trò</label>
              <select
                className="form-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="">-- Chọn quyền --</option>
                <option value="ROLE_CUSTOMER">CUSTOMER</option>
                <option value="ROLE_ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setshowAddModal(false)}
              >
                Hủy
              </button>
              <button
                className={`btn ${
                  validateEmail(newEmail) &&
                  newPassword.length >= 6 &&
                  newRole &&
                  newPassword === confirmPassword
                    ? "btn-primary"
                    : "btn-secondary disabled"
                }`}
                onClick={handleCreateAccount}
                disabled={
                  !validateEmail(newEmail) ||
                  newPassword.length < 6 ||
                  !newRole ||
                  newPassword !== confirmPassword
                }
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 2000 }}
        >
          <div
            className={`toast show align-items-center text-white bg-${
              toastType === "success" ? "success" : "danger"
            } border-0`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">{toastMessage}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowToast(false)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    position: "relative",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "4px",
    width: "900px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    color: "#999",
  },
};

export default CustomerManagement;
