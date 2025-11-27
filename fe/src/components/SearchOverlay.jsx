// src/components/SearchOverlay.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SearchOverlay({ onClose }) {
  const [searchText, setSearchText] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Gọi lấy toàn bộ sản phẩm (dùng DTO mới: thumbnailUrl, priceMin, salePriceMin, averageRating, totalReviews,...)
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8080/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi lấy dữ liệu");
        }
        return response.json();
      })
      .then((data) => {
        setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Lỗi:", err);
        setError("Không thể tải danh sách sản phẩm");
      })
      .finally(() => setLoading(false));
  }, []);

  // Lọc sản phẩm theo từ khóa (theo tên, mã, brand)
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredProducts([]);
      return;
    }

    const keyword = searchText.toLowerCase();

    const filtered = allProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const code = (p.code || "").toLowerCase();
      const brandName = (p.brandName || "").toLowerCase();
      return (
        name.includes(keyword) ||
        code.includes(keyword) ||
        brandName.includes(keyword)
      );
    });

    setFilteredProducts(filtered);
  }, [searchText, allProducts]);

  // Hàm render sao đánh giá (dùng averageRating)
  const renderStars = (rating) => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    const fullStars = Math.floor(safeRating);
    const halfStar = safeRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="fas fa-star"></i>
        ))}
        {halfStar && <i className="fas fa-star-half-alt"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="far fa-star"></i>
        ))}
      </>
    );
  };

  const handleClickProduct = (product) => {
    // ưu tiên đi theo slug nếu có, không thì dùng id
    const slugOrId = product.slug || product.id;
    navigate(`/products/${slugOrId}`);
    onClose?.();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 bg-white bg-opacity-90 shadow-lg d-flex flex-column"
      style={{
        zIndex: 2000,
        height: "60vh",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Style cho card giống Home cũ */}
      <style>{`
        .search-product-card {
          background: #fff;
          border-radius: .75rem;
          overflow: hidden;
          box-shadow: 0 .125rem .25rem rgba(0,0,0,.075);
          transition: box-shadow .3s ease;
          position: relative;
        }
        .search-product-card:hover {
          box-shadow: 0 1rem 2rem rgba(0,0,0,.15);
        }
        .search-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          transition: transform .5s ease;
          display: block;
        }
        .search-product-card:hover .search-product-image {
          transform: scale(1.08);
        }
        .search-sale-badge {
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

      {/* Phần header chứa logo và ô tìm kiếm */}
      <div className="container py-2 my-0">
        <div className="d-flex justify-content-between align-items-center">
          <div className="fw-bold fs-5 text-dark">
            <a href="/">
              <img
                src="/images/LogoNgang.png"
                alt="Home"
                style={{ width: "max-content", height: "60px", paddingTop: "4px" }}
                className="card-img-top"
              />
            </a>
          </div>

          <div
            className="position-relative border border-black rounded-pill px-3 bg-white shadow-sm mx-3 flex-grow-1"
            style={{ maxWidth: "40rem", height: "40px" }}
          >
            <input
              type="text"
              className="form-control border-0 rounded-pill ps-3 pe-5 h-100"
              placeholder="Tìm kiếm laptop, PC, linh kiện..."
              autoFocus
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                boxShadow: "none",
                backgroundColor: "transparent",
                fontSize: "1rem",
                paddingTop: "0",
                paddingBottom: "0",
              }}
            />

            {searchText ? (
              <button
                type="button"
                className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                style={{
                  zIndex: 5,
                  height: "24px",
                  width: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setSearchText("")}
              >
                <i className="fas fa-times small"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                style={{
                  zIndex: 5,
                  height: "24px",
                  width: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Search"
              >
                <i className="fas fa-search small"></i>
              </button>
            )}
          </div>

          <button
            className="btn text-muted"
            onClick={onClose}
            style={{ textDecoration: "none" }}
          >
            <i className="fas fa-times fs-1"></i>
          </button>
        </div>
      </div>

      {/* Vùng danh sách có scroll riêng */}
      <div
        className="flex-grow-1 overflow-auto"
        style={{ padding: "0 1rem" }}
      >
        {loading && (
          <div className="text-center text-muted mt-3">
            Đang tải sản phẩm...
          </div>
        )}
        {error && (
          <div className="text-center text-danger mt-3">{error}</div>
        )}

        {!loading && !error && searchText.trim() !== "" && filteredProducts.length === 0 && (
          <div className="text-center text-muted mt-3">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        )}

        <div
          className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3"
          style={{
            marginLeft: "9rem",
            marginRight: "9rem",
            marginTop: "1rem",
            marginBottom: "1rem",
          }}
        >
          {filteredProducts.map((product) => {
            const hasSale =
              product.salePriceMin != null &&
              product.priceMin != null &&
              product.salePriceMin < product.priceMin;

            const priceOriginal = product.priceMin || 0;
            const priceSale = hasSale ? product.salePriceMin : null;

            const avgRating = product.averageRating || 0;
            const reviewCount = product.totalReviews || 0;

            return (
              <div key={product.id} className="col">
                <div
                  className="search-product-card h-100 d-flex flex-column justify-content-between"
                  style={{ height: "320px", cursor: "pointer" }}
                  onClick={() => handleClickProduct(product)}
                >
                  {/* Vùng ảnh */}
                  <div
                    className="position-relative overflow-hidden"
                    style={{ height: "55%" }}
                  >
                    <img
                      src={
                        product.thumbnailUrl ||
                        "https://via.placeholder.com/400x400?text=No+Image"
                      }
                      alt={product.name}
                      className="search-product-image w-100 h-100"
                    />
                    {hasSale && (
                      <div className="search-sale-badge">
                        -
                        {Math.round(
                          ((priceOriginal - priceSale) / priceOriginal) * 100
                        )}
                        %
                      </div>
                    )}
                  </div>

                  {/* Nội dung bên dưới */}
                  <div className="p-3 d-flex flex-column justify-content-between" style={{ height: "45%" }}>
                    <h3 className="fs-6 mb-2 text-truncate">
                      {product.name}
                    </h3>

                    {/* Giá */}
                    <div className="d-flex align-items-center mb-2">
                      {hasSale ? (
                        <>
                          <span className="text-danger fw-bold">
                            {Math.round(priceSale).toLocaleString("vi-VN")}₫
                          </span>
                          <span className="text-secondary text-decoration-line-through ms-2">
                            {Math.round(priceOriginal).toLocaleString("vi-VN")}₫
                          </span>
                        </>
                      ) : (
                        <span className="text-secondary fw-semibold">
                          {Math.round(priceOriginal).toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="d-flex align-items-center">
                      <div style={{ color: "#ede734" }}>
                        {renderStars(avgRating)}
                      </div>
                      <span className="text-secondary small ms-2">
                        ({reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SearchOverlay;
