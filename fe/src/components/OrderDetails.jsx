import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

/* ================= COMPONENT ================= */
export default function OrderDetails({ orderDT, onClose }) {
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(null);

  const [canReviewMap, setCanReviewMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const statusBadgeColor = {
    CHO_THANH_TOAN: "warning",
    DA_THANH_TOAN: "success",
    HUY_THANH_TOAN: "secondary",
    THANH_TOAN_THAT_BAI: "danger",
    GIAO_HANG_THANH_CONG: "success",
  };

  /* ================= LOAD CAN REVIEW ================= */
  useEffect(() => {
    const loadCanReview = async () => {
      const map = {};
      for (const item of orderDT.items) {
        const res = await apiFetch(
          `/api/reviews/can-review?orderItemId=${item.id}`
        );
        map[item.id] = await res.json();
      }
      setCanReviewMap(map);
    };

    if (orderDT?.items?.length) {
      loadCanReview();
    }
  }, [orderDT]);

  /* ================= SUBMIT REVIEW ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || !comment) {
      alert("Vui lòng nhập đầy đủ đánh giá");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          orderItemId: selectedOrderItemId,
          rating,
          comment,
        }),
      });

      // 👇 nếu apiFetch trả về response
      if (!res || res.error) {
        throw new Error(res?.message || "Đánh giá thất bại");
      }

      // chỉ chạy khi THÀNH CÔNG
      setRating(0);
      setComment("");
      setIsRating(false);

      setCanReviewMap((prev) => ({
        ...prev,
        [selectedOrderItemId]: false,
      }));

      alert("Đánh giá thành công");
    } catch (err) {
      console.error(err);
      alert("Đánh giá thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>
          ×
        </button>

        <div style={styles.sliderWrapper}>
          <div
            style={{
              ...styles.slider,
              transform: isRating ? "translateX(-50%)" : "translateX(0)",
            }}
          >
            {/* ================= ORDER INFO ================= */}
            <div style={styles.panel}>
              <h5 className="fw-bold border-bottom pb-2">Thông tin đơn hàng</h5>

              <p className="fw-semibold">{orderDT.userName}</p>
              <p className="text-muted">📍 {orderDT.shippingAddress}</p>
              <p className="text-muted">📞 {orderDT.userPhoneNumber}</p>
              <p className="text-muted">🧾 {orderDT.orderCode}</p>

              <p className="text-muted">
                Trạng thái:{" "}
                <span
                  className={`badge bg-${
                    statusBadgeColor[orderDT.status] || "secondary"
                  }`}
                >
                  {orderDT.status}
                </span>
              </p>

              <table className="table align-middle">
                <thead className="text-secondary small">
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th className="text-end">Giá</th>
                    <th className="text-center">SL</th>
                    <th className="text-end">Tổng</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderDT.items.map((item) => {
                    const canReview =
                      item.canReview === true || canReviewMap[item.id];
                    const pv = item.productVariantDTO;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={pv.productImage}
                              alt=""
                              width={50}
                              className="me-2"
                            />
                            {pv.productName}
                          </div>
                        </td>
                        <td>{pv.sku?.replace("SKU_", "")}</td>
                        <td className="text-end">
                          {item.unitPrice.toLocaleString()}₫
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end fw-semibold">
                          {item.totalPrice.toLocaleString()}₫
                        </td>
                        <td className="text-end">
                          {canReview && (
                            <button
                              className="btn btn-link text-warning p-0"
                              onClick={() => {
                                setSelectedOrderItemId(item.id);
                                setIsRating(true);
                              }}
                            >
                              ⭐
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-end fw-bold">
                      Tổng:
                    </td>
                    <td className="text-end fw-bold fs-5">
                      {orderDT.totalAmount.toLocaleString()}₫
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ================= RATING ================= */}
            <div style={styles.panel}>
              <h5 className="fw-bold border-bottom pb-2 mb-3">
                Đánh giá sản phẩm
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Đánh giá của bạn
                  </label>

                  <div className="d-flex align-items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`${
                          (hoverRating || rating) >= star ? "fas" : "far"
                        } fa-star`}
                        style={{
                          fontSize: 28,
                          cursor: "pointer",
                          color: "#ede734",
                          marginRight: 6,
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>

                  {(hoverRating || rating) > 0 && (
                    <div className="text-muted small mt-1">
                      {(() => {
                        const v = hoverRating || rating;
                        if (v === 1) return "Rất tệ";
                        if (v === 2) return "Tệ";
                        if (v === 3) return "Bình thường";
                        if (v === 4) return "Tốt";
                        return "Rất tốt";
                      })()}
                    </div>
                  )}
                </div>

                <textarea
                  className="form-control mb-3"
                  rows={4}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (chất lượng, đóng gói, giao hàng...)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn btn-warning fw-semibold px-4"
                  disabled={loading}
                >
                  {loading ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </form>

              <button
                className="btn btn-link mt-3"
                onClick={() => setIsRating(false)}
              >
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    width: 800,
    maxHeight: 520,
    padding: 20,
    overflowY: "auto",
    position: "relative",
  },
  closeBtn: {
    zIndex: 10,
    position: "absolute",
    right: 10,
    top: 5,
    fontSize: 30,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  sliderWrapper: { overflow: "hidden" },
  slider: {
    display: "flex",
    width: "200%",
    transition: "0.4s",
  },
  panel: { width: "50%", padding: 10 },
};
