// src/pages/HomePage.jsx (hoặc đường dẫn tương đương project của m)

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header"; // chỉnh lại path nếu khác
import HeroBanner from "../../components/HeroBanner"; // chỉnh lại path nếu khác
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import Chatbot from "../../components/Chatbot";

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [deepDiscountProducts, setDeepDiscountProducts] = useState([]);
  const [mostReviewedProducts, setMostReviewedProducts] = useState([]);
  const [highestRatedProducts, setHighestRatedProducts] = useState([]);

  const scrollToTop = () =>
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  // ===== BACK TO TOP =====
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ===== TOAST THÔNG BÁO =====
  const showToast = async (message, type = "success") => {
    const toastEl = document.getElementById("success-toast");

    if (!toastEl) {
      console.log("Không tìm thấy toastEl:", toastEl);
      return;
    }

    const toastBody = toastEl.querySelector(".toast-body");
    if (toastBody) toastBody.innerText = message;

    toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");
    if (type === "success") toastEl.classList.add("bg-success");
    if (type === "danger") toastEl.classList.add("bg-danger");
    if (type === "warning") toastEl.classList.add("bg-warning");

    const toastModule = await import("bootstrap/js/dist/toast");
    const ToastClass = toastModule.default;
    const toast = new ToastClass(toastEl);
    toast.show();
  };

  // ===== LOGIN SUCCESS / LOCKED =====
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const success = localStorage.getItem("loginSuccess");
    if (success === "true") {
      setTimeout(() => {
        showToast("Đăng nhập thành công!", "success");
      }, 0);
      localStorage.removeItem("loginSuccess");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      if (error === "locked") {
        showToast(
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!",
          "danger"
        );
      } else {
        showToast("Đã xảy ra lỗi không xác định!", "warning");
      }

      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search]);

  // ===== FETCH SẢN PHẨM HOME (WEB BÁN MÁY TÍNH) =====
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const res = await fetch(
          "http://localhost:8080/api/public/products/home"
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        setDeepDiscountProducts(data.deepDiscountProducts || []);
        setMostReviewedProducts(data.mostReviewedProducts || []);
        setHighestRatedProducts(data.highestRatedProducts || []);
        setBestSellingProducts(data.bestSellingProducts || []);
        console.log("deepDiscountProducts:", data.deepDiscountProducts?.length);
        console.log("mostReviewedProducts:", data.mostReviewedProducts?.length);
        console.log("highestRatedProducts:", data.highestRatedProducts?.length);
        console.log("bestSellingProducts:", data.bestSellingProducts?.length);
      } catch (err) {
        console.error(err);
        setErrorProducts("Không tải được sản phẩm trang chủ");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchHomeProducts();
  }, []);

  // ===== UTIL RATING =====
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<i key={i} className="fas fa-star "></i>);
      } else if (rating >= i - 0.5) {
        stars.push(<i key={i} className="fas fa-star-half-alt"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star"></i>);
      }
    }
    return stars;
  };

  const getAverageRating = (product) => {
    const reviews = product.reviews || [];
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / reviews.length;
  };
  // ===== CATEGORIES (GIỮ GIAO DIỆN CŨ – M TỰ ĐỔI THÀNH DANH MỤC MÁY TÍNH NẾU MUỐN) =====
  const categories = [
    {
      id: 1,
      name: "Laptop gaming",
      image: "https://minhhightech.com/admin/sanpham/ONEXPLAYER-G1_26_6196.jpg",
      href: "/products?category=laptop-gaming",
    },
    {
      id: 2,
      name: "PC văn phòng",
      image:
        "https://maytinhgiaphat.vn/wp-content/uploads/2025/08/may-tinh-de-ban-ttc-01.jpg",
      href: "/products?category=pc-office",
    },
    {
      id: 3,
      name: "Màn hình",
      image: "https://www.sieuthimaychu.vn/datafiles/setone/15985036335554.jpg",
      href: "/products?category=monitor",
    },
    {
      id: 4,
      name: "Phụ kiện",
      image:
        "https://phukienpico.com/wp-content/uploads/2024/11/Chuot-gaming-x1-4.jpg",
      href: "/products?category=accessories",
    },
  ];

  // ===== RENDER PRODUCT CARD GIỐNG HOME CŨ =====
  const renderProductCard = (product) => {
    const totalRating = product.totalReviews || 0;
    const averageRating = product.averageRating || 0;

    return (
      <a
        href={`/products/detail/${product.slug}?productId=${product.id}`}
        className="text-decoration-none text-black"
      >
        <div className="col">
          <div className="product-card">
            <div
              className="position-relative overflow-hidden"
              style={{ width: "100%", paddingTop: "100%" }}
            >
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="position-absolute top-0 start-0 w-100 h-100 product-image"
                style={{ objectFit: "cover" }}
              />

              {product.salePriceMin && (
                <div className="sale-badge">
                  -
                  {Math.round(
                    ((product.priceMin - product.salePriceMin) /
                      product.priceMin) *
                      100
                  )}
                  %
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="fs-5 mb-2 text-truncate">{product.name}</h3>

              <div className="d-flex align-items-center mb-2">
                {product.salePriceMin ? (
                  <>
                    <span className="text-danger fw-bold">
                      {Number(product.salePriceMin).toLocaleString("vi-VN")}₫
                    </span>
                    <span className="text-secondary text-decoration-line-through ms-2">
                      {Number(product.priceMin).toLocaleString("vi-VN")}₫
                    </span>
                  </>
                ) : (
                  <span className="text-secondary">
                    {Number(product.priceMin).toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center">
                <div style={{ color: "#ede734" }}>
                  {renderStars(averageRating)}
                </div>
                <span className="text-secondary small ms-2">
                  ({totalRating})
                </span>
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <>
      <Chatbot />
      {/* HEADER MỚI CỦA M */}
      <Header
        setShowLoginModal={setShowLoginModal}
        setShowSearch={setShowSearch}
      />

      {/* MODAL YÊU CẦU LOGIN (KHI BẤM CART CHƯA LOGIN) */}
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
                ></button>
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

      <div className="container-fluid" style={{ padding: 0 }}>
        {/* TOAST */}
        <div
          id="success-toast"
          className="toast position-fixed bottom-0 end-0 text-white m-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ zIndex: 9999 }}
        >
          <div className="d-flex">
            <div className="toast-body">Thông báo</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>

        {/* HERO BANNER (NHẤC NGUYÊN TỪ PROJECT CŨ) */}
        <HeroBanner />

        {/* ===== DANH MỤC NỔI BẬT (GIỮ GIAO DIỆN CŨ) ===== */}
        <style>{`
          .category-card {
            transition: box-shadow .3s ease;
            border-radius: .75rem;
            overflow: hidden;
            position: relative;
          }
          .category-card:hover {
            box-shadow: 0 1rem 2rem rgba(0,0,0,.15);
          }
          .category-image {
            transition: transform .5s ease;
            object-fit: cover;
            object-position: top;
            height: 16rem;
            width: 100%;
            display: block;
          }
          .category-card:hover .category-image {
            transform: scale(1.1);
          }
          .category-overlay {
            background: linear-gradient(to top, rgba(0,0,0,.7), rgba(0,0,0,.2), transparent);
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 1rem;
          }
          .shop-btn {
            background-color: #ede734;
            color: #000000;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 0.875rem;
            opacity: 0;
            transform: translateY(1rem);
            transition: all 0.3s ease;
            cursor: pointer;
            white-space: nowrap;
            border: none;
          }
          .category-card:hover .shop-btn {
            opacity: 1;
            transform: translateY(0);
          }

          .product-card {
            background: #fff;
            border-radius: .75rem;
            overflow: hidden;
            box-shadow: 0 .125rem .25rem rgba(0,0,0,.075);
            transition: box-shadow .3s ease;
            position: relative;
          }
          .product-card:hover {
            box-shadow: 0 1rem 2rem rgba(0,0,0,.15);
          }
          .product-image {
            width: 100%;
            height: 16rem;
            object-fit: cover;
            object-position: top;
            transition: transform .5s ease;
            display: block;
          }
          .product-card:hover .product-image {
            transform: scale(1.1);
          }
          .sale-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: linear-gradient(45deg, #ff1e00, #d30000); 
            color: white;
            padding: 4px 10px;
            font-size: 0.75rem;
            font-weight: bold;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            text-transform: uppercase;
            z-index: 10;
          }
        `}</style>

        <div className="mx-5 mt-5">
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-3 fw-bold text-dark">Danh mục nổi bật</h3>
            </div>
            <div className="row g-3">
              {categories.map((category) => (
                <div key={category.id} className="col-12 col-md-6 col-lg-3">
                  <div className="category-card shadow-sm">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="category-image"
                    />
                    <div className="category-overlay">
                      <h3 className="fs-5 fw-bold text-white mb-2">
                        {category.name}
                      </h3>
                      <button
                        type="button"
                        className="shop-btn"
                        onClick={() => navigate(category.href)}
                      >
                        Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===== 3 BLOCK SẢN PHẨM: GIẢM GIÁ / NHIỀU REVIEW / CAO NHẤT ===== */}
        <div className="mx-5 mt-5">
          {loadingProducts && <div className="mb-4">Đang tải sản phẩm...</div>}
          {errorProducts && (
            <div className="mb-4 text-danger">{errorProducts}</div>
          )}

          {/* 1. GIẢM GIÁ SÂU NHẤT */}
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-3 fw-bold text-dark">Giảm giá sâu nhất</h3>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
              {deepDiscountProducts.map((p) => (
                <React.Fragment key={p.id}>
                  {renderProductCard(p)}
                </React.Fragment>
              ))}
              {!loadingProducts &&
                !errorProducts &&
                deepDiscountProducts.length === 0 && (
                  <div className="col-12 text-muted">
                    Chưa có sản phẩm giảm giá.
                  </div>
                )}
            </div>
          </section>

          {/* 2. ĐƯỢC ĐÁNH GIÁ NHIỀU NHẤT */}
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-3 fw-bold text-dark">
                Được đánh giá nhiều nhất
              </h3>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
              {mostReviewedProducts.map((p) => (
                <React.Fragment key={p.id}>
                  {renderProductCard(p)}
                </React.Fragment>
              ))}
              {!loadingProducts &&
                !errorProducts &&
                mostReviewedProducts.length === 0 && (
                  <div className="col-12 text-muted">
                    Chưa có sản phẩm nào được đánh giá.
                  </div>
                )}
            </div>
          </section>

          {/* 3. ĐƯỢC ĐÁNH GIÁ CAO NHẤT */}
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-3 fw-bold text-dark">Được đánh giá cao nhất</h3>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
              {highestRatedProducts.map((p) => (
                <React.Fragment key={p.id}>
                  {renderProductCard(p)}
                </React.Fragment>
              ))}
              {!loadingProducts &&
                !errorProducts &&
                highestRatedProducts.length === 0 && (
                  <div className="col-12 text-muted">Chưa có sản phẩm nào.</div>
                )}
            </div>
          </section>
          <section className="mb-5">
            <h3 className="fs-3 fw-bold text-dark">Bán chạy nhất</h3>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
              {bestSellingProducts.map((p) => (
                <React.Fragment key={p.id}>
                  {renderProductCard(p)}
                </React.Fragment>
              ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {/* BACK TO TOP */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="btn position-fixed end-0 m-4 rounded-circle shadow"
          style={{
            width: "48px",
            height: "48px",
            zIndex: 1050,
            backgroundColor: "#ede734",
            bottom: "56px",
          }}
        >
          <i className="fas fa-arrow-up text-dark"></i>
        </button>
      )}

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}

export default HomePage;
