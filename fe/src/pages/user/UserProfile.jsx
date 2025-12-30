import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import { apiFetch } from "../../api/client";
import OrderDetails from "../../components/OrderDetails";
export default function UserProfile() {
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showModalOrder, setShowModalOrder] = useState(false);
  const [orderDT, setOrderDT] = useState(null);
  const statusBadgeColor = {
  CHO_THANH_TOAN: "warning",        // chờ thanh toán
  DA_THANH_TOAN: "success",         // đã thanh toán
  HUY_THANH_TOAN: "secondary",      // huỷ thanh toán
  THANH_TOAN_THAT_BAI: "danger",    // thanh toán thất bại
};

  // mock functions để tránh lỗi
  const handleViewOrderDT = () => {};
  const handleViewOrder = () => {};
  const handlePrint = () => {};
  /* ================= FETCH PROFILE ================= */
  const loadProfile = async () => {
    const res = await apiFetch("/api/user-profiles/me");
    const data = await res.json();

    setProfile(data);
    setFullName(data.fullName || "");
    setPhone(data.phoneNumber || "");
    setAddress(data.address || "");
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /* ================= PAYMENT RESULT ================= */
  useEffect(() => {
    const status = location.state?.paymentStatus;
    if (!status) return;

    setPaymentStatus(status);
    setShowPaymentModal(true);

    // clear state để reload /profile không bật lại modal
    window.history.replaceState({}, document.title);
  }, [location.state]);
  useEffect(() => {
    const loadOrders = async () => {
      const res = await apiFetch("/api/orders/me");
      const data = await res.json();
      setOrders(data);
    };
    loadOrders();
  }, []);

  /* ================= VALIDATE ================= */
  const validatePhone = (value) => /^(0[3|5|7|8|9])[0-9]{8}$/.test(value);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !phone || !address) return;

    if (!validatePhone(phone)) {
      setPhoneError("Số điện thoại không hợp lệ (VD: 0981234567)");
      return;
    }

    await apiFetch("/api/user-profiles/me", {
      method: "PUT",
      body: JSON.stringify({
        fullName,
        phoneNumber: phone,
        address,
      }),
    });

    setShowEditModal(false);
    setShowToast(true);

    setTimeout(() => setShowToast(false), 3000);
    loadProfile();
  };

  if (!profile) {
    return <div className="text-center mt-5">Đang tải dữ liệu...</div>;
  }

  return (
    <>
      <Header setShowSearch={setShowSearch} />

      {/* ================= PAYMENT MODAL ================= */}
      {showPaymentModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4">
              {paymentStatus === "SUCCESS" && (
                <>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "#2ecc71",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <span style={{ fontSize: 40, color: "#fff" }}>✓</span>
                  </div>

                  <h4 style={{ color: "#2ecc71", fontWeight: 600 }}>
                    Thanh toán thành công
                  </h4>

                  <p className="text-muted mt-2">
                    Đơn hàng của quý khách đã thanh toán thành công. Chúng tôi
                    sẽ sớm liên hệ để bàn giao sản phẩm, dịch vụ.
                  </p>
                </>
              )}

              {paymentStatus === "CANCELLED" && (
                <>
                  <h4 className="text-warning mt-3">Thanh toán bị huỷ</h4>
                  <p className="text-muted">Bạn đã huỷ giao dịch thanh toán.</p>
                </>
              )}

              {paymentStatus === "FAILED" && (
                <>
                  <h4 className="text-danger mt-3">Thanh toán thất bại</h4>
                  <p className="text-muted">Giao dịch không thành công.</p>
                </>
              )}

              <button
                className="btn btn-dark mt-3 px-4"
                onClick={() => setShowPaymentModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST ================= */}
      {showToast && (
        <div
          className="position-fixed bottom-0 end-0 m-3"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-success text-white p-3 rounded shadow">
            Cập nhật thông tin thành công!
            <button
              className="btn-close btn-close-white float-end"
              onClick={() => setShowToast(false)}
            />
          </div>
        </div>
      )}

      {/* ================= EDIT PROFILE MODAL ================= */}
      {showEditModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cập nhật thông tin cá nhân</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Họ và tên</label>
                    <input
                      className="form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className={`form-control ${
                        phoneError ? "is-invalid" : ""
                      }`}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError(
                          validatePhone(e.target.value)
                            ? ""
                            : "Số điện thoại không hợp lệ"
                        );
                      }}
                      required
                    />
                    {phoneError && (
                      <div className="invalid-feedback">{phoneError}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Địa chỉ giao hàng</label>
                    <input
                      className="form-control"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-success">
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <div
        className="container-fluid"
        style={{ backgroundColor: "#f0f2f5", padding: "30px 0" }}
      >
        <div className="container shadow-lg rounded bg-white p-4">
          <h3 className="text-center mb-4">Thông tin cá nhân</h3>

          <div
            className="card shadow rounded overflow-hidden mb-4 w-100"
            style={{ maxWidth: "none" }}
          >
            {/* Header */}
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h3 className="h5 mb-0">Danh sách đơn hàng</h3>
            </div>
            {/* Table container */}
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr className="border-bottom">
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Mã đơn hàng
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Địa chỉ nhận hàng
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Ngày đặt
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Tổng tiền
                    </th>
                    <th
                      scope="col"
                      className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                    >
                      Trạng thái
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
                  {orders.map((order) => (
                    <tr key={order.orderCode} className="border-bottom">
                      {/* Mã đơn hàng */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <div className="small fw-medium text-dark">
                          {order.orderCode}
                        </div>
                      </td>
                      {/* Khách hàng */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <div className="small fw-medium text-dark">
                          {order.shippingAddress}
                        </div>
                        {/* <div className="small text-secondary">{order.customer.phone}</div> */}
                      </td>
                      {/* Ngày đặt */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <div className="small text-secondary">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      </td>
                      {/* Tổng tiền */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <div className="small text-secondary">
                          {Math.round(order.totalAmount).toLocaleString(
                            "vi-VN"
                          )}{" "}
                          VND
                        </div>
                      </td>
                      {/* Trạng thái */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <span
                          className={`badge bg-${
                            statusBadgeColor[order.status] || "secondary"
                          } px-2 py-1 small`}
                        >
                          {order.status}
                        </span>
                      </td>
                      {/* Thao tác */}
                      <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                        <div className="d-flex align-items-center">
                          <button
                            className="btn btn-link text-dark p-0 me-3"
                            title="Xem chi tiết"
                            onClick={async () => {
                              const res = await apiFetch(
                                `/api/orders/${order.orderCode}`
                              );
                              const data = await res.json();
                              setOrderDT(data);
                              setShowModalOrder(true);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {order.status === "GIAO_HANG_THANH_CONG" && (
                            <button
                              onClick={() => {
                                handleViewOrder(order.orderCode);
                                setTimeout(handlePrint, 100);
                              }}
                              className="btn btn-link text-secondary p-0 me-3"
                              title="In hóa đơn"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer phân trang & thống kê */}
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Họ và tên</label>
              <input
                className="form-control"
                value={profile.fullName || ""}
                disabled
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                value={profile.email || ""}
                disabled
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Số điện thoại</label>
              <input
                className="form-control"
                value={profile.phoneNumber || ""}
                disabled
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Địa chỉ giao hàng</label>
              <input
                className="form-control"
                value={profile.address || ""}
                disabled
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-dark w-100 mt-4"
            onClick={() => setShowEditModal(true)}
          >
            Cập nhật thông tin
          </button>
        </div>
      </div>

      <Footer />
      {showModalOrder && orderDT && (
        <OrderDetails
          orderDT={orderDT}
          onClose={() => {
            setShowModalOrder(false);
            setOrderDT(null);
          }}
        />
      )}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
