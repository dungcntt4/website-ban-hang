// src/components/SearchOverlay.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function SearchOverlay({ onClose }) {
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const horizontalRef = useRef(null);
  const navigate = useNavigate();
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState({});
  const GAP = 10;
  const CARD_WIDTH = 220 + 20; // 240
  const PAGE_WIDTH = CARD_WIDTH * 5 + GAP * 4;
  // ===== debounce search =====
  useEffect(() => {
    if (!searchText.trim()) {
      setPages({});
      setCurrentPage(1);
      setTotalPages(0);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearch(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // ===== gọi BE search =====
  async function fetchSearch(page) {
    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(
        `http://localhost:8080/api/public/products/search` +
          `?keyword=${encodeURIComponent(searchText)}` +
          `&pageNum=${page}` +
          `&pageSize=5`,
      );

      if (!resp.ok) throw new Error("Search failed");

      const json = await resp.json();

      setPages((prev) => ({
        ...prev,
        [page]: json.products || [],
      }));
      setPageNum(json.pageNum);
      setTotalPages(json.totalPages);
    } catch (e) {
      setError("Không thể tìm kiếm sản phẩm");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const el = horizontalRef.current;
    if (!el) return;

    let ticking = false;

    const onWheel = (e) => {
      if (totalPages <= 1) return;

      e.preventDefault();
      if (ticking) return;
      ticking = true;

      if (e.deltaY > 0 && currentPage < totalPages) {
        const next = currentPage + 1;
        setCurrentPage(next);
        fetchSearch(next);
      }

      if (e.deltaY < 0 && currentPage > 1) {
        const prev = currentPage - 1;
        setCurrentPage(prev);
        fetchSearch(prev);
      }

      setTimeout(() => (ticking = false), 400); // debounce
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [currentPage, totalPages, products]);

  const handleClickProduct = (product) => {
    navigate(`/products/detail/${product.slug}?productId=${product.id}`);
    onClose?.();
  };

  // ===== render stars giữ nguyên =====
  const renderStars = (rating) => {
    const safe = Number.isFinite(rating) ? rating : 0;
    const full = Math.floor(safe);
    const half = safe % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <>
        {[...Array(full)].map((_, i) => (
          <i key={`f-${i}`} className="fas fa-star"></i>
        ))}
        {half && <i className="fas fa-star-half-alt"></i>}
        {[...Array(empty)].map((_, i) => (
          <i key={`e-${i}`} className="far fa-star"></i>
        ))}
      </>
    );
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
      onClick={onClose}
    >
      {" "}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "1400px",
          height: "80vh",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
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
                  style={{
                    width: "max-content",
                    height: "60px",
                    paddingTop: "4px",
                  }}
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
        <div className="flex-grow-1" style={{ padding: "0 1rem" }}>
          {loading && (
            <div className="text-center text-muted mt-3">
              Đang tải sản phẩm...
            </div>
          )}
          {error && <div className="text-center text-danger mt-3">{error}</div>}

          {!loading &&
            !error &&
            searchText.trim() !== "" &&
            Object.keys(pages).length === 0 && (
              <div className="text-center text-muted mt-3">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            )}

          <div
            ref={horizontalRef}
            style={{
              width:  `${PAGE_WIDTH}px`,
              margin: "0 auto",
              overflow: "hidden", // chỉ cắt TRANSFORM page
            }}
          >
            <div
              style={{
                display: "flex",
                gap: `${GAP}px`,
                padding: "16px 12px", // ✅ SAFE ZONE CHO HOVER
                transform: `translateX(-${(currentPage - 1) * PAGE_WIDTH}px)`,
                transition: "transform 0.45s ease",
              }}
            >
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const pageProducts = pages[page] || [];

                return (
                  <div
                    key={page}
                    style={{
                      display: "flex",
                      gap: `${GAP}px`,
                      width: `${PAGE_WIDTH}px`,
                      flexShrink: 0,
                    }}
                  >
                    {pageProducts.map((product) => {
                      const hasSale =
                        product.salePriceMin != null &&
                        product.priceMin != null &&
                        product.salePriceMin < product.priceMin;

                      const priceOriginal = product.priceMin || 0;
                      const priceSale = hasSale ? product.salePriceMin : null;

                      const avgRating = product.averageRating || 0;
                      const reviewCount = product.totalReviews || 0;

                      return (
                        <div
                          key={product.id}
                          style={{
                            width: "220px",
                            flexShrink: 0,
                            marginBottom: "10px",
                            marginTop:"10px",
                            marginRight:"7px",
                            marginLeft:"7px"
                          }}
                        >
                          <div
                            className="search-product-card"
                            style={{ height: "350px", cursor: "pointer" }}
                            onClick={() => handleClickProduct(product)}
                          >
                            {/* IMAGE */}
                            <div style={{ height: "60%", overflow: "hidden" }}>
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="search-product-image"
                              />
                              {hasSale && (
                                <div className="search-sale-badge">
                                  {" "}
                                  -{" "}
                                  {Math.round(
                                    ((priceOriginal - priceSale) /
                                      priceOriginal) *
                                      100,
                                  )}{" "}
                                  %{" "}
                                </div>
                              )}
                            </div>

                            {/* INFO */}
                            <div className="p-3">
                              <h3 className="fs-6 text-truncate">
                                {product.name}
                              </h3>

                              <div className="mb-2">
                                {hasSale ? (
                                  <>
                                    <span className="text-danger fw-bold">
                                      {Math.round(priceSale).toLocaleString(
                                        "vi-VN",
                                      )}
                                      ₫
                                    </span>
                                    <span className="text-decoration-line-through ms-2">
                                      {Math.round(priceOriginal).toLocaleString(
                                        "vi-VN",
                                      )}
                                      ₫
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    {Math.round(priceOriginal).toLocaleString(
                                      "vi-VN",
                                    )}
                                    ₫
                                  </span>
                                )}
                              </div>

                              <div style={{ color: "#ede734" }}>
                                {renderStars(avgRating)}
                                <span className="text-secondary ms-2">
                                  ({reviewCount})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <style>{`
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>
      </div>
    </div>
  );
}

export default SearchOverlay;
