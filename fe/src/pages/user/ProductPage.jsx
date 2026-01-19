// src/pages/ProductPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
import Chatbot from "../../components/Chatbot";
import { Link, useSearchParams, useParams } from "react-router-dom";
import "./ProductPage.css";

function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: categorySlugFromPath } = useParams();
  const categorySlug = categorySlugFromPath || null;

  // ==== STATE ====
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [specFilters, setSpecFilters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  // filter popup
  const [openFilter, setOpenFilter] = useState(null);

  // selected filters
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.getAll("brand"),
  );

  // selected specs (không lấy brand/sort/page từ query)
  const [selectedSpecs, setSelectedSpecs] = useState({});

  const [sortOrder, setSortOrder] = useState(searchParams.get("sort") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Khi đổi category trên path, reset page về 1
  useEffect(() => {
    setPage(1);
  }, [categorySlug]);

  // =============== FETCH DATA (SERVER PAGINATION) ===============
  useEffect(() => {
    // Nếu chưa có categorySlug (ví dụ user gõ trực tiếp /products) thì không fetch
    if (!categorySlug) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Base URL luôn có category trong path
        const baseUrl = `/api/public/products/${categorySlug}`;

        const params = new URLSearchParams();

        // paging
        params.set("pageNum", page);
        params.set("pageSize", pageSize);

        // sort
        if (sortOrder) {
          params.set("sort", sortOrder);
        }

        // brand filter
        selectedBrands.forEach((b) => params.append("brand", b));

        Object.values(selectedSpecs).forEach((ids) => {
          ids.forEach((id) => params.append("specificationValue", id));
        });

        const url = `${baseUrl}?${params.toString()}`;

        const res = await fetch(url, { signal });

        if (!res.ok) {
          console.error("Load product error, status =", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();

        setProducts(data.products || []);
        setBrands(data.brands || []);
        setSpecFilters(data.specifications || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
        setBreadcrumb(data.breadcrumb || []);
      } catch (err) {
        if (err.name === "AbortError") {
          // request bị cancel do unmount/change dependency => bỏ qua
          return;
        }
        console.error("Load product error:", err);
        setLoading(false);
      }
    };

    fetchProducts();

    // cleanup khi dependency thay đổi / component unmount
    return () => {
      controller.abort();
    };
  }, [categorySlug, selectedBrands, selectedSpecs, sortOrder, page, pageSize]);

  // =============== SYNC URL PARAMS (KHÔNG ĐẨY CATEGORY VÀO QUERY) ===============
  useEffect(() => {
    const params = new URLSearchParams();

    selectedBrands.forEach((b) => params.append("brand", b));

    Object.values(selectedSpecs).forEach((ids) => {
      ids.forEach((id) => params.append("specificationValue", id));
    });

    if (sortOrder) params.set("sort", sortOrder);
    if (page > 1) params.set("page", page);

    setSearchParams(params);
  }, [selectedBrands, selectedSpecs, sortOrder, page, setSearchParams]);

  // =============== FILTER PROCESS (chỉ áp dụng spec & sort trên trang hiện có) ===============
  const currentProducts = useMemo(() => {
    let list = [...products];

    // brand filter (dự phòng, BE đã filter rồi)
    if (selectedBrands.length > 0) {
      list = list.filter((p) =>
        selectedBrands.includes(p.brand?.slug || p.brand?.name),
      );
    }

    // sort FE (dự phòng: nếu BE sort rồi thì kết quả cùng chiều)
    if (sortOrder === "priceAsc") {
      list.sort(
        (a, b) =>
          (a.salePriceMin || a.priceMin) - (b.salePriceMin || b.priceMin),
      );
    }
    if (sortOrder === "priceDesc") {
      list.sort(
        (a, b) =>
          (b.salePriceMin || b.priceMin) - (a.salePriceMin || a.priceMin),
      );
    }

    return list;
  }, [products, selectedBrands, selectedSpecs, sortOrder]);

  // =============== HANDLE FILTER ===============

  const toggleBrand = (slug) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug],
    );
    setPage(1);
    setOpenFilter(null);
  };

  const toggleSpec = (attribute, specValueId) => {
    setSelectedSpecs((prev) => {
      const copy = { ...prev };
      if (!copy[attribute]) copy[attribute] = [];

      copy[attribute] = copy[attribute].includes(specValueId)
        ? copy[attribute].filter((id) => id !== specValueId)
        : [...copy[attribute], specValueId];

      return copy;
    });

    setPage(1);
    setOpenFilter(null);
  };

  // =============== UI LOADING ===============
  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-wrapper">
          <span>Đang tải sản phẩm...</span>
        </div>
        <Footer />
      </>
    );
  }
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<i key={i} className="fas fa-star"></i>);
      } else if (rating >= i - 0.5) {
        stars.push(<i key={i} className="fas fa-star-half-alt"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star"></i>);
      }
    }
    return stars;
  };

  // =============== UI MAIN ===============
  return (
    <>
      <Chatbot />

      <Header
        setShowLoginModal={setShowLoginModal}
        setShowSearch={setShowSearch}
      />

      {/* ================= PRODUCT GRID ================= */}
      <main className="container my-2">
        <nav
          aria-label="breadcrumb"
          style={{
            "--bs-breadcrumb-divider":
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='%23005db4'/%3E%3C/svg%3E\")",
          }}
        >
          <ol
            className="breadcrumb"
            style={{
              marginBottom: 0,
              fontSize: 14,
              alignItems: "center",
            }}
          >
            {/* Trang chủ */}
            <li className="breadcrumb-item">
              <Link
                to="/"
                style={{
                  color: "#005db4",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Trang chủ
              </Link>
            </li>

            {/* Category breadcrumb từ BE */}
            {breadcrumb?.map((c, index) => {
              const isLast = index === breadcrumb.length - 1;

              return (
                <li
                  key={c.slug}
                  className="breadcrumb-item"
                  aria-current={isLast ? "page" : undefined}
                  style={{
                    color: isLast ? "#333" : "#005db4",
                    fontWeight: isLast ? 600 : 500,
                  }}
                >
                  {isLast ? (
                    c.name
                  ) : (
                    <Link
                      to={`/products/${c.slug}`}
                      style={{
                        color: "#005db4",
                        textDecoration: "none",
                      }}
                    >
                      {c.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ================= FILTER BAR (CANH GIỮA) ================= */}
        <div className="filter-bar-wrapper">
          <div className="filter-bar">
            {/* BRAND DROPDOWN */}
            <button
              className="filter-btn"
              onClick={() =>
                setOpenFilter(openFilter === "brand" ? null : "brand")
              }
            >
              Hãng {selectedBrands.length > 0 && `(${selectedBrands.length})`}
            </button>

            {/* SPEC FILTERS */}
            {specFilters.map((spec) => (
              <button
                key={spec.attribute}
                className="filter-btn"
                onClick={() =>
                  setOpenFilter(
                    openFilter === spec.attribute ? null : spec.attribute,
                  )
                }
              >
                {spec.attribute}
                {selectedSpecs[spec.attribute]?.length > 0 &&
                  `(${selectedSpecs[spec.attribute].length})`}
              </button>
            ))}

            {/* SORT */}
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Mặc định</option>
              <option value="priceAsc">Giá tăng dần</option>
              <option value="priceDesc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* ================= POPUP ================= */}
        {openFilter && (
          <div className="filter-popup">
            <div className="popup-header">
              <h5>Bộ lọc: {openFilter === "brand" ? "Hãng" : openFilter}</h5>
              <button
                className="btn-close"
                onClick={() => setOpenFilter(null)}
              />
            </div>

            <div className="popup-body">
              {/* BRAND POPUP */}
              {openFilter === "brand" &&
                brands.map((b) => (
                  <label className="filter-option" key={b.slug}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b.slug)}
                      onChange={() => toggleBrand(b.slug)}
                    />
                    <img src={b.image} alt={b.name} className="brand-icon" />
                    {b.name}
                  </label>
                ))}

              {/* SPEC POPUP */}
              {specFilters
                .filter((s) => s.attribute === openFilter)
                .flatMap((s) =>
                  s.values.map((value) => (
                    <label className="filter-option" key={value.id}>
                      <input
                        type="checkbox"
                        checked={selectedSpecs[openFilter]?.includes(value.id)}
                        onChange={() => toggleSpec(openFilter, value.id)}
                      />
                      {value.text}
                    </label>
                  )),
                )}
            </div>
          </div>
        )}
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
          {currentProducts.map((p) => (
            <div className="col" key={p.id}>
              <Link
                to={`/products/detail/${p.slug}?productId=${p.id}`}
                className="text-decoration-none"
              >
                <div className="product-card">
                  {/* IMAGE WRAPPER (VUÔNG 1:1) */}
                  <div
                    className="position-relative overflow-hidden"
                    style={{ width: "100%", paddingTop: "100%" }}
                  >
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      className="position-absolute top-0 start-0 w-100 h-100 product-image"
                      style={{ objectFit: "cover" }}
                    />

                    {p.salePriceMin && (
                      <div className="sale-badge">
                        -
                        {Math.round(
                          ((p.priceMin - p.salePriceMin) / p.priceMin) * 100,
                        )}
                        %
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-3">
                    <h5 className="text-truncate" style={{ color: "black" }}>
                      {p.name}
                    </h5>

                    <div className="price-area">
                      {p.salePriceMin ? (
                        <>
                          <span className="sale-price">
                            {Number(p.salePriceMin).toLocaleString("vi-VN")}₫
                          </span>
                          <span className="old-price">
                            {Number(p.priceMin).toLocaleString("vi-VN")}₫
                          </span>
                        </>
                      ) : (
                        <span className="normal-price">
                          {Number(p.priceMin).toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-center">
                      <div style={{ color: "#ede734" }}>
                        {renderStars(p.averageRating || 0)}
                      </div>
                      <span className="text-secondary small ms-2">
                        ({p.totalReviews || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {currentProducts.length === 0 && (
            <div className="col-12 text-center text-muted">
              Không tìm thấy sản phẩm phù hợp
            </div>
          )}
        </div>

        {/* Pagination (dùng totalPages từ BE) */}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="page-btn"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`page-btn ${page === i + 1 ? "active" : ""}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="page-btn"
            >
              ›
            </button>
          </div>
        )}
      </main>
      <Footer />
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}

export default ProductPage;
