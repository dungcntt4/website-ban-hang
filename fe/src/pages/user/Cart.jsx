import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../api/client";

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  /* ================= FETCH CART ================= */
  useEffect(() => {
    if (!user && !accessToken) return;
    
    apiFetch("/api/cart")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setItems([]));
  }, [loading, user]);

  /* ================= TOTAL ================= */
  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      if (!selectedIds.includes(it.id)) return sum;
      const v = it.productVariant;
      const price = v.discountPrice ?? v.price;
      return sum + price * it.quantity;
    }, 0);
  }, [items, selectedIds]);

  /* ================= SELECT ================= */
  const toggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const validIds = items
        .filter((i) => !i.productVariant.deleted && i.productVariant.stock > 0)
        .map((i) => i.id);
      setSelectedIds(validIds);
    }
    setSelectAll(!selectAll);
  };

  /* ================= QUANTITY ================= */
  const updateQty = async (id, delta) => {
    const cur = items.find((i) => i.id === id);
    if (!cur) return;

    const max = cur.productVariant.stock;
    const next = Math.min(Math.max(1, cur.quantity + delta), max);

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: next } : i))
    );

    await apiFetch(`/api/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: next }),
    });
  };

  /* ================= DELETE ================= */
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;

    await apiFetch("/api/cart/delete-multiple", {
      method: "POST",
      body: JSON.stringify(selectedIds),
    });

    setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    setSelectedIds([]);
    setSelectAll(false);
    setShowDeleteModal(false);
  };

  /* ================= CHECKOUT ================= */
  const checkout = () => {
    if (selectedIds.length === 0) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }
    navigate("/checkout", { state: { cartItemIds: selectedIds } });
  };

  return (
    <>
      <Header setShowSearch={setShowSearch} />

      <div className="container container-cart">
        <style>{`
          .container-cart {
            max-width: 1200px;
            margin: 50px auto;
            background: #fff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,.1);
          }
          h1 { text-align:center; margin-bottom:20px; }
          .cart-wrapper { display:flex; justify-content:space-between; }
          .cart { width:70%; }
          .cart-header {
            display:grid;
            grid-template-columns: .4fr 2fr 1fr 1fr 1fr;
            font-weight:bold;
            border-bottom:1px solid #ddd;
            padding:10px 0;
          }
          .cart-item {
            display:grid;
            grid-template-columns: .4fr 2fr 1fr 1fr 1fr;
            align-items:center;
            border-bottom:1px solid #ddd;
            padding:10px 0;
            position:relative;
          }
          .overlay {
            position:absolute;
            top:0; left:0;
            width:100%;
            background:#6c757d;
            color:#fff;
            text-align:center;
            padding:5px;
            font-weight:bold;
            z-index:1;
          }
          .cart-item-details {
            display:flex;
            align-items:center;
          }
          .cart-item-details img {
            width:100px; height:100px; margin-right:20px;
          }
          .qty {
            display:flex;
            border:1px solid #ddd;
            width:100px;
          }
          .qty button {
            width:40px; border:none; background:#f0f0f0;
          }
          .qty input {
            width:40px; border:none; text-align:center;
          }
          .price b { color:#bf0c0c; }
          .sum { color:#bf0c0c; font-weight:bold; }
          .select-delete {
            display:flex;
            justify-content:space-between;
            margin:10px 0;
          }
          .cart-summary {
            width:25%;
            background:#f9f9f9;
            padding:20px;
            border:1px solid #ddd;
            height:fit-content;
            position:sticky;
            top:120px;
          }
          .cart-summary-item {
            display:flex;
            justify-content:space-between;
            font-size:1.2em;
            margin-bottom:20px;
          }
          .checkout-btn {
            width:100%;
            background:#ede734;
            border:none;
            padding:10px;
          }
          .toast-box {
            position:fixed;
            bottom:20px;
            right:20px;
            background:#ffc107;
            padding:15px;
            border-radius:6px;
            box-shadow:0 0 10px rgba(0,0,0,.2);
          }
        `}</style>

        <h1>Giỏ hàng của bạn</h1>

        <div className="cart-wrapper">
          <div className="cart">
            <div className="cart-header">
              <div />
              <div>Sản phẩm</div>
              <div>Giá</div>
              <div>Số lượng</div>
              <div>Thành tiền</div>
            </div>

            <div className="select-delete">
              <label>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleAll}
                />{" "}
                Chọn tất cả
              </label>
              <button
                className="btn text-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Xóa bỏ
              </button>
            </div>

            {items.map((it) => {
              const v = it.productVariant;
              const unavailable = v.deleted || v.stock === 0;
              const price = v.discountPrice ?? v.price;

              return (
                <div
                  key={it.id}
                  className="cart-item"
                  style={{ opacity: unavailable ? 0.5 : 1 }}
                >
                  {unavailable && (
                    <div className="overlay">
                      {v.deleted
                        ? "Sản phẩm không còn tồn tại"
                        : "Sản phẩm đã hết hàng"}
                    </div>
                  )}

                  <input
                    type="checkbox"
                    checked={selectedIds.includes(it.id)}
                    disabled={unavailable}
                    onChange={() => toggleItem(it.id)}
                  />

                  <div className="cart-item-details">
                    <img src={v.product.image} alt="" />
                    <div>
                      <h5>{v.product.name}</h5>
                      <p>{v.name}</p>
                    </div>
                  </div>

                  <div className="price">
                    {v.discountPrice && <s>{v.price.toLocaleString()}₫</s>}
                    <div>
                      <b>{price.toLocaleString()}₫</b>
                    </div>
                  </div>

                  <div className="qty">
                    <button
                      onClick={() => updateQty(it.id, -1)}
                      disabled={unavailable}
                    >
                      -
                    </button>
                    <input readOnly value={it.quantity} />
                    <button
                      onClick={() => updateQty(it.id, 1)}
                      disabled={unavailable}
                    >
                      +
                    </button>
                  </div>

                  <div className="sum">
                    {(price * it.quantity).toLocaleString()}₫
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-item">
              <span>Tổng cộng:</span>
              <b>{total.toLocaleString()}₫</b>
            </div>
            <button type="button" className="checkout-btn" onClick={checkout}>
              Thanh toán
            </button>
          </div>
        </div>
      </div>

      <Footer />
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}

      {showDeleteModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Xóa sản phẩm</h5>
              </div>
              <div className="modal-body">Bạn có chắc chắn muốn xóa?</div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
                <button className="btn btn-danger" onClick={deleteSelected}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="toast-box">
          Bạn cần chọn ít nhất 1 sản phẩm để thanh toán
        </div>
      )}
    </>
  );
}
