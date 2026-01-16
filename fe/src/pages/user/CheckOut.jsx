import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import { apiFetch } from "../../api/client";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItemIds } = location.state || {};
  const [selectedItems, setSelectedItems] = useState([]);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  /* ===== GUARD ===== */
  useEffect(() => {
    if (!cartItemIds || cartItemIds.length === 0) {
      navigate("/cart");
    }
  }, [cartItemIds, navigate]);

  useEffect(() => {
    if (!cartItemIds) return;

    apiFetch("/api/cart/preview", {
      method: "POST",
      body: JSON.stringify(cartItemIds),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSelectedItems)
      .catch(() => navigate("/cart"));
  }, [cartItemIds, navigate]);

  /* ===== FETCH DEFAULT USER PROFILE (1 LẦN) ===== */
  useEffect(() => {
    apiFetch("/api/user-profiles/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!data.phoneNumber) {
          alert("Vui lòng cập nhật thông tin cá nhân trước khi thanh toán");
          navigate("/profile"); // hoặc không navigate nếu em chỉ muốn báo lỗi
          return;
        }

        setProfile(data); // ✅ chỉ set khi hợp lệ
      })
      .catch(() => {
        alert("Không lấy được thông tin người dùng");
      });
  }, [navigate]);

  const totalPrice = React.useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const v = item.productVariant;
      const price = v.discountPrice ?? v.price;
      return sum + price * item.quantity;
    }, 0);
  }, [selectedItems]);

  if (!profile) return null;

  /* ================= PAYMENT ================= */
  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // 1) CREATE ORDER
      const orderRes = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: "VNPAY",
          shippingAddress: profile.address,
          receiverName: profile.fullName,
          receiverPhone: profile.phoneNumber,
          totalAmount: totalPrice,
          cartItemIds,
          items: selectedItems.map((item) => {
            const v = item.productVariant;
            const unitPrice = v.discountPrice ?? v.price;
            return {
              productVariantId: v.id,
              quantity: item.quantity,
              costPrice: v.costPrice,
              unitPrice,
              totalPrice: unitPrice * item.quantity,
            };
          }),
        }),
      });

      if (!orderRes.ok) throw new Error("Create order failed");
      const order = await orderRes.json();

      // 2) CREATE VNPAY URL
      const payRes = await apiFetch("/api/payment/vnpay-create", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          orderCode: order.orderCode,
          amount: String(order.totalAmount),
          vnp_OrderInfo: `Thanh toán đơn hàng #${order.orderCode}`,
          ordertype: "fashion",
          language: "vn",
        }).toString(),
      });

      const payData = await payRes.json();
      if (!payRes.ok || payData.code !== "00") {
        throw new Error(payData.message || "Không tạo được link VNPay");
      }

      // BE đang trả { paymentUrl: "..." } (theo log của m)
      window.location.replace(payData.paymentUrl);
    } catch (e) {
      alert("Thanh toán thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header
        setShowLoginModal={setShowLoginModal}
        setShowSearch={setShowSearch}
      />
      <style>{`
  .btn-momo {
    background-color: #ede734;
    color: #212529;
    border: none;
    border-radius: .375rem;
    transition: background-color .2s;
  }
  .btn-momo:hover {
    background-color: #d5cf2e;
  }
  .rounded-button {
    border-radius: .375rem;
  }
  .spinner-gradient {
    border-top-color: #ede734 !important;
    width: 2rem;
    height: 2rem;
    border-width: .25rem;
  }
  .bg-purple-50 {
    background-color: #f5f3ff;
  }
  .border-purple-100 {
    border: 1px solid #ede7ff !important;
  }
  .text-purple-600 {
    color: #5b21b6 !important;
  }
  .text-purple-800:hover {
    color: #4c1d95 !important;
  }
            `}</style>

      <div
        className="container-fluid min-vh-100 py-5 px-2 px-sm-4"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <div className="container shadow-lg rounded bg-white p-4 p-md-5">
          <h1 className="text-center text-dark mb-5 display-6 fw-bold">
            Thanh Toán Đơn Hàng
          </h1>
          <div className="row">
            <div className="col-lg-8">
              <div
                className="card mb-4 shadow rounded w-100"
                style={{ maxWidth: "none" }}
              >
                <div className="card-body">
                  <h2 className="h5 fw-semibold mb-4 d-flex align-items-center">
                    <i
                      className="fas fa-shipping-fast me-2"
                      style={{ color: "#ede734" }}
                    ></i>
                    Thông Tin Giao Hàng
                  </h2>

                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="me-3 text-secondary"
                      style={{ width: "2.5rem" }}
                    >
                      <i className="fas fa-user fa-lg"></i>
                    </div>
                    <div>
                      <div className="small text-secondary">Họ và tên</div>
                      <div className="fw-medium">{profile.fullName}</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="me-3 text-secondary"
                      style={{ width: "2.5rem" }}
                    >
                      <i className="fas fa-phone-alt fa-lg"></i>
                    </div>
                    <div>
                      <div className="small text-secondary">Số điện thoại</div>
                      <div className="fw-medium">{profile.phoneNumber}</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="me-3 text-secondary"
                      style={{ width: "2.5rem" }}
                    >
                      <i className="fas fa-map-marker-alt fa-lg"></i>
                    </div>
                    <div>
                      <div className="small text-secondary">
                        Địa chỉ giao hàng
                      </div>
                      <div className="fw-medium">{profile.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="card mb-4 shadow rounded w-100"
                style={{ maxWidth: "none" }}
              >
                <div className="card-body">
                  <h2 className="h5 fw-semibold mb-4 d-flex align-items-center">
                    <i
                      className="fas fa-shopping-cart me-2"
                      style={{ color: "#ede734" }}
                    ></i>
                    Chi Tiết Đơn Hàng
                  </h2>

                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="bg-white text-secondary small text-uppercase border-bottom">
                        <tr>
                          <th className="py-3 px-2 text-start">Sản phẩm</th>
                          <th className="py-3 px-2 text-start">Mã SP</th>
                          <th className="py-3 px-2 text-end">Đơn giá</th>
                          <th className="py-3 px-2 text-center">SL</th>
                          <th className="py-3 px-2 text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item, i) => {
                          const name = item.productVariant.product.name;
                          const size = item.productVariant.sku;
                          const v = item.productVariant;
                          const price = v.discountPrice ?? v.price;
                          const qty = item.quantity;
                          const total = price * qty;

                          const imageUrl = item.productVariant.product.image;

                          return (
                            <tr key={i} className="border-bottom">
                              <td className="pr-4 py-4 align-middle">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="border rounded overflow-hidden bg-light d-flex justify-content-center align-items-center"
                                    style={{ width: "64px", height: "64px" }}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "top",
                                      }}
                                    />
                                  </div>
                                  <div className="ms-3">
                                    <p
                                      className="mb-0 fw-semibold text-dark text-truncate"
                                      style={{ maxWidth: "150px" }}
                                    >
                                      {name}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-2 text-secondary small align-middle">
                                {size}
                              </td>
                              <td className="py-3 px-2 text-secondary text-end align-middle">
                                {price.toLocaleString("vi-VN")}₫
                              </td>
                              <td className="py-3 px-2 text-secondary text-center align-middle">
                                {qty}
                              </td>
                              <td className="py-3 px-2 fw-semibold text-dark text-end align-middle">
                                {total.toLocaleString("vi-VN")}₫
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot>
                        <tr>
                          <td
                            colSpan={4}
                            className="text-end fw-semibold py-3 px-2"
                          >
                            Tổng thanh toán:
                          </td>
                          <td className="text-end fw-bold fs-5 py-3 px-2">
                            {totalPrice.toLocaleString()}₫
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card mb-4 shadow rounded">
                <div className="card-body">
                  <h2 className="h5 fw-semibold mb-4 d-flex align-items-center">
                    <i
                      className="fas fa-credit-card me-2"
                      style={{ color: "#ede734" }}
                    ></i>
                    Phương Thức Thanh Toán
                  </h2>
                  <div className="bg-purple-50 border-purple-100 p-3 rounded">
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-purple-600 text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 48, height: 48 }}
                      >
                        <img
                          src="/images/logoVNPAY.webp"
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "contain",
                          }}
                          alt="VNPAY"
                        />
                      </div>
                      <div className="ms-3">
                        <div className="fw-semibold text-dark">
                          {" "}
                          Ví VNPay (ATM/QR Code)
                        </div>
                        <small className="text-muted">
                          Thanh toán an toàn qua VNPay – xác nhận trong vài giây
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow rounded">
                <div className="card-body">
                  <div className="d-flex justify-content-between text-base fw-medium mb-2">
                    <span>Tổng cộng</span>
                    <span>{totalPrice.toLocaleString()}₫</span>
                  </div>
                  <small className="text-muted">Đã bao gồm VAT</small>

                  <div className="mt-4">
                    {isLoading ? (
                      <div className="text-center">
                        <div
                          className="spinner-border text-warning spinner-gradient mb-3"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-secondary">
                          Đang chuyển hướng đến cổng thanh toán...
                        </p>
                        <a
                          href="#"
                          className="small text-purple-600 text-decoration-none"
                        >
                          Nếu không được chuyển hướng, nhấn vào đây
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={handlePayment}
                        className="btn btn-momo w-100 rounded-button d-flex align-items-center justify-content-center"
                      >
                        <i className="fas fa-wallet me-2"></i>Thanh toán bằng
                        VNPay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </div>
  );
}

export default Checkout;
