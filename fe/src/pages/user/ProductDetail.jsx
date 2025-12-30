import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api/client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import { useAuth } from "../../context/AuthContext";

import "./ProductDetail.css";

export default function ProductDetail() {
  const { slug } = useParams(); // chỉ dùng SEO
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const productId = searchParams.get("productId"); // UUID sản phẩm

  const [product, setProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const [selectedVariantId, setSelectedVariantId] = useState(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showToastSuccess, setShowToastSuccess] = useState(false);
  const [showToastError, setShowToastError] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== Helper render sao =====
  const renderStars = (rating) => {
    return (
      <div className="star-container" style={{ color: "#ede734" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= rating ? "fas fa-star" : "far fa-star"} />
        ))}
      </div>
    );
  };

  // Giá dùng để so sánh/tìm rẻ nhất: ưu tiên discountPrice
  const getVariantEffectivePrice = (v) => {
    if (v.discountPrice != null) return Number(v.discountPrice);
    return Number(v.price || 0);
  };

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/public/products/detail/${productId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch product detail");
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data);

        // Ảnh mặc định
        if (data.images?.length > 0) {
          setCurrentImage(data.images[0].url);
        }

        // ===== CHỌN VARIANT RẺ NHẤT (ƯU TIÊN CÒN HÀNG) =====
        if (data.variants && data.variants.length > 0) {
          let candidates = data.variants.filter((v) => v.stock > 0);
          if (candidates.length === 0) {
            candidates = data.variants;
          }

          const cheapestVariant = candidates.reduce((min, v) => {
            if (!min) return v;
            const priceV = getVariantEffectivePrice(v);
            const priceMin = getVariantEffectivePrice(min);
            return priceV < priceMin ? v : min;
          }, null);

          if (cheapestVariant) {
            setSelectedVariantId(cheapestVariant.id);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading product detail:", err);
        setError(err.message || "Có lỗi xảy ra");
        setLoading(false);
      });
  }, [productId]);

  if (loading) return <div className="text-center mt-5">Đang tải...</div>;
  if (error)
    return <div className="text-center mt-5 text-danger">Lỗi: {error}</div>;
  if (!product)
    return <div className="text-center mt-5">Không tìm thấy sản phẩm</div>;

  // ===== LẤY VARIANT ĐANG CHỌN =====
  const selectedVariant =
    product.variants?.find((v) => v.id === selectedVariantId) || null;

  // ===== TÍNH DISCOUNT CHO VARIANT ĐANG CHỌN (DÙNG CHO GIÁ + BADGE ẢNH) =====
  let selectedHasDiscount = false;
  let selectedDiscountPercent = 0;
  let displayPrice = 0; // giá đang bán (đỏ)
  let originalPrice = null; // giá gốc (bị gạch)

  if (selectedVariant) {
    const price = Number(selectedVariant.price || 0);
    const discount =
      selectedVariant.discountPrice != null
        ? Number(selectedVariant.discountPrice)
        : null;

    if (discount != null && discount < price) {
      selectedHasDiscount = true;
      selectedDiscountPercent = Math.round((1 - discount / price) * 100);
      displayPrice = discount;
      originalPrice = price;
    } else {
      displayPrice = price;
      originalPrice = null;
    }
  } else if (product.salePriceMin != null) {
    displayPrice = Number(product.salePriceMin);
    originalPrice = Number(product.priceMin);
  } else {
    displayPrice = Number(product.priceMin);
    originalPrice = null;
  }

  // ===== TÍNH TOÁN PHẦN ĐÁNH GIÁ =====
  const reviews = product.reviews || [];
  const totalRating = reviews.length;

  const averageRating =
    totalRating > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRating
      : 0;

  const ratingsDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage =
      totalRating > 0 ? Math.round((count / totalRating) * 100) : 0;
    return [star, percentage];
  });

  const productReviews = reviews.map((r) => ({
    user: { fullname: r.userName },
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("vi-VN")
      : "",
  }));

  const addToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedVariantId) {
      alert("Vui lòng chọn phiên bản/size!");
      return;
    }

    try {
      const res = await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productVariantId: selectedVariantId,
          quantity,
        }),
      });

      if (!res.ok) {
        // LOG RA ĐỂ BIẾT CHÍNH XÁC
        const text = await res.text();
        console.error("Add to cart failed:", res.status, text);

        setShowToastError(true);
        setTimeout(() => setShowToastError(false), 2000);
        return;
      }
      setShowToastSuccess(true);
      setTimeout(() => setShowToastSuccess(false), 2000);
    } catch (e) {
      console.error(e);
      setShowToastError(true);
      setTimeout(() => setShowToastError(false), 2000);
    }
  };

  const buyNow = async () => {
    await addToCart();
    navigate("/checkout");
  };

  return (
    <>
      <Header
        setShowLoginModal={setShowLoginModal}
        setShowSearch={setShowSearch}
      />

      {/* KHUNG CHÍNH SẢN PHẨM */}
      <div className="container product-detail-container shadow rounded mt-4">
        {/* MAIN ROW */}
        <div className="row pt-4">
          {/* LEFT: GALLERY */}
          <div className="col-4 p-0">
            <div className="product-gallery">
              <div className="main-image">
                {/* BADGE SALE GÓC ẢNH – CHỈ HIỆN KHI VARIANT ĐANG CHỌN CÓ GIẢM GIÁ */}
                {selectedHasDiscount && (
                  <div className="sale-badge-image">
                    -{selectedDiscountPercent}%
                  </div>
                )}

                {currentImage && <img src={currentImage} alt="product" />}
              </div>

              <div className="thumbnail-container d-flex align-items-center justify-content-center mt-2 gap-2">
                {product.images?.map((img, idx) => (
                  <img
                    key={idx}
                    className={`thumbnail ${
                      img.url === currentImage ? "active" : ""
                    }`}
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setCurrentImage(img.url)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className="col-8 px-4">
            <h2 className="mb-3">{product.name}</h2>
            <hr />

            {/* GIÁ THEO VARIANT ĐANG CHỌN */}
            {originalPrice ? (
              <>
                <p className="text-danger fs-4">
                  <b>{displayPrice.toLocaleString()}₫</b>
                </p>
                <p className="text-muted fs-5">
                  <s>{originalPrice.toLocaleString()}₫</s>
                </p>
              </>
            ) : (
              <p className="text-danger fs-4">
                <b>{displayPrice.toLocaleString()}₫</b>
              </p>
            )}

            <p className="text-dark fs-5">
              Thương hiệu:
              {product.brand && (
                <>
                  <img
                    src={product.brand.image}
                    alt={product.brand.name}
                    className="brand-logo ms-2"
                  />
                  <b className="ms-2">{product.brand.name}</b>
                </>
              )}
            </p>

            {/* ===== VARIANT DẠNG CARD (SẢN PHẨM CÙNG LOẠI) – KHÔNG CÒN BADGE Ở ĐÂY ===== */}
            {product.variants?.length > 0 && (
              <div className="variant-box">
                <div className="fw-bold mb-2">Sản phẩm cùng loại</div>

                <div className="row g-3">
                  {product.variants.map((v) => {
                    const isOut = v.stock === 0;
                    const isSelected = v.id === selectedVariantId;

                    const hasDiscount =
                      v.discountPrice != null &&
                      Number(v.discountPrice) < Number(v.price);

                    const effectivePrice = hasDiscount
                      ? Number(v.discountPrice)
                      : Number(v.price || 0);

                    return (
                      <div className="col-md-4" key={v.id}>
                        <div
                          className={
                            "variant-card" +
                            (isSelected ? " selected" : "") +
                            (isOut ? " disabled" : "")
                          }
                          onClick={() => {
                            if (!isOut) {
                              setSelectedVariantId(v.id);
                            }
                          }}
                        >
                          <div className="d-flex justify-content-start align-items-start">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                checked={isSelected}
                                readOnly
                              />
                              <label className="form-check-label fw-semibold">
                                {v.name}
                              </label>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="variant-price-current">
                              {effectivePrice.toLocaleString()}₫
                            </div>
                            {hasDiscount && v.price && (
                              <div className="variant-price-original">
                                <s>{Number(v.price).toLocaleString()}₫</s>
                              </div>
                            )}
                          </div>

                          {isOut && <div className="variant-out">Hết hàng</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY */}
            <div className="quantity-control mb-3">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <input readOnly value={quantity} />
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>

            <button className="btn btn-outline-dark me-2" onClick={addToCart}>
              Thêm vào giỏ hàng
            </button>

            <button className="btn btn-warning" onClick={buyNow}>
              Mua ngay
            </button>
          </div>
        </div>

        {/* TABS: MÔ TẢ + ĐỔI TRẢ */}
        <div className="tabs mt-4 mb-0">
          <div
            className={`tab ${activeTab === "description" ? "active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Mô tả sản phẩm
          </div>
          <div
            className={`tab ${activeTab === "return" ? "active" : ""}`}
            onClick={() => setActiveTab("return")}
          >
            Chính sách đổi trả
          </div>
        </div>
        <hr className="m-0" />

        {/* TAB CONTENT */}
        <div className="content p-4">
          {/* DESCRIPTION TAB */}
          {activeTab === "description" && (
            <>
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description}</p>

              {/* SPECIFICATION TABLE */}
              {product.specifications && (
                <>
                  <h4 className="mt-4">Thông số kỹ thuật</h4>
                  <table className="table table-bordered spec-table">
                    <tbody>
                      {Object.keys(product.specifications).map((key) => (
                        <tr key={key}>
                          <th style={{ width: "30%" }}>{key}</th>
                          <td>{product.specifications[key].join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* RETURN TAB */}
          {activeTab === "return" && (
            <div id="return">
              <h3>Chính sách đổi trả</h3>
              <p>
                Sản phẩm đủ điều kiện bảo hành nếu đáp ứng các điều kiện sau:
              </p>
              <ul>
                <li>Lỗi kỹ thuật từ nhà sản xuất hoặc vận chuyển</li>
                <li>Còn đầy đủ tem phiếu và chưa qua sử dụng</li>
                <li>Đổi trả trong vòng 3 ngày từ khi nhận hàng</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ==== KHỐI ĐÁNH GIÁ SẢN PHẨM ==== */}
      <div
        className="container"
        style={{
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
          borderRadius: 10,
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        <div className="row" style={{ padding: 40 }}>
          <div className="col-4" style={{ padding: 0, paddingLeft: 100 }}>
            <div className="score">
              <span className="score-average">{averageRating.toFixed(1)}</span>
              <span className="score-max">/5</span>
            </div>
            <div
              className="container-star"
              style={{ width: "166.25px", height: "33.25px" }}
            >
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="count">{totalRating} lượt đánh giá</div>
          </div>
          <div className="col-8" style={{ padding: 0 }}>
            <div className="detail" style={{ marginTop: 0 }}>
              <ul>
                {ratingsDistribution.map(([key, value]) => (
                  <li key={key} style={{ height: 40 }}>
                    <div
                      className="container-star progress-title"
                      style={{ width: 150, height: 40 }}
                    >
                      {renderStars(key)}
                    </div>
                    <div className="progress-wrap">
                      <div className="pdp-review-progress">
                        <div className="bar bg" />
                        <div
                          className="bar fg"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="percent">{value}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="row" style={{ padding: 40, paddingTop: 0 }}>
          <hr />
          <div className="product-reviews">
            <h2>Đánh giá sản phẩm</h2>
            {productReviews.length === 0 ? (
              <p>Hiện tại chưa có lượt đánh giá nào.</p>
            ) : (
              productReviews.map((review, index) => (
                <div className="review" key={index}>
                  <div className="user">{review.user.fullname}</div>
                  <div
                    className="rating"
                    style={{
                      marginTop: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    {renderStars(review.rating)}
                  </div>
                  <p style={{ marginBottom: "10px" }}>{review.comment}</p>
                  <div className="timestamp text-secondary">
                    Thời gian: {review.created_at}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}

      {/* Toasts */}
      {showToastSuccess && (
        <div className="toast-box success">Thêm vào giỏ hàng thành công</div>
      )}

      {showToastError && (
        <div className="toast-box error">Không đủ số lượng sản phẩm</div>
      )}

      {/* Modal login */}
      {showLoginModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yêu cầu đăng nhập</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLoginModal(false)}
                />
              </div>
              <div className="modal-body">
                <p>Bạn cần đăng nhập để thực hiện chức năng này.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  onClick={() => setShowLoginModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
