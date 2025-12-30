// src/pages/ProductPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchOverlay from "../../components/SearchOverlay";
// import Chatbot from "../../components/Chatbot"; // ❌ bỏ tạm
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

  // filter popup
  const [openFilter, setOpenFilter] = useState(null);

  // selected filters
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.getAll("brand")
  );

  // selected specs (không lấy brand/sort/page từ query)
  const [selectedSpecs, setSelectedSpecs] = useState(() => {
    const map = {};
    searchParams.forEach((val, key) => {
      if (key !== "brand" && key !== "sort" && key !== "page") {
        if (!map[key]) map[key] = [];
        map[key].push(val);
      }
    });
    return map;
  });

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

      // spec filter: hiện tại BE chưa nhận specValue, nên chưa gửi
      // sau này nếu trả về id của specificationValue thì append ở đây:
      // params.append("specificationValue", id);

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
}, [categorySlug, selectedBrands, sortOrder, page, pageSize]);


  // =============== SYNC URL PARAMS (KHÔNG ĐẨY CATEGORY VÀO QUERY) ===============
  useEffect(() => {
    const params = new URLSearchParams();

    selectedBrands.forEach((b) => params.append("brand", b));

    Object.keys(selectedSpecs).forEach((attr) => {
      selectedSpecs[attr].forEach((val) => params.append(attr, val));
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
        selectedBrands.includes(p.brand?.slug || p.brand?.name)
      );
    }

    // specifications filter (FE xử lý)
    Object.keys(selectedSpecs).forEach((attr) => {
      const values = selectedSpecs[attr];
      if (!values || values.length === 0) return;
      list = list.filter((p) => {
        const specValues = p.specifications?.[attr] || [];
        return values.some((v) => specValues.includes(v));
      });
    });

    // sort FE (dự phòng: nếu BE sort rồi thì kết quả cùng chiều)
    if (sortOrder === "priceAsc") {
      list.sort(
        (a, b) =>
          (a.salePriceMin || a.priceMin) - (b.salePriceMin || b.priceMin)
      );
    }
    if (sortOrder === "priceDesc") {
      list.sort(
        (a, b) =>
          (b.salePriceMin || b.priceMin) - (a.salePriceMin || a.priceMin)
      );
    }

    return list;
  }, [products, selectedBrands, selectedSpecs, sortOrder]);

  // =============== HANDLE FILTER ===============

  const toggleBrand = (slug) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug]
    );
    setPage(1);
  };

  const toggleSpec = (attr, value) => {
    setSelectedSpecs((prev) => {
      const copy = { ...prev };
      if (!copy[attr]) copy[attr] = [];
      if (copy[attr].includes(value)) {
        copy[attr] = copy[attr].filter((v) => v !== value);
      } else {
        copy[attr].push(value);
      }
      return copy;
    });
    setPage(1);
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

  // =============== UI MAIN ===============
  return (
    <>
      {/* <Chatbot /> */}

      <Header
        setShowLoginModal={setShowLoginModal}
        setShowSearch={setShowSearch}
      />

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
                  openFilter === spec.attribute ? null : spec.attribute
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
            <button className="btn-close" onClick={() => setOpenFilter(null)} />
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
                  <label className="filter-option" key={value}>
                    <input
                      type="checkbox"
                      checked={selectedSpecs[openFilter]?.includes(value)}
                      onChange={() => toggleSpec(openFilter, value)}
                    />
                    {value}
                  </label>
                ))
              )}
          </div>
        </div>
      )}

      {/* ================= PRODUCT GRID ================= */}
      <main className="container my-4">
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
          {currentProducts.map((p) => (
            <div className="col" key={p.id}>
               <Link
                to={`/products/detail/${p.slug}?productId=${p.id}`}
                className="text-decoration-none"
              >
                <div className="product-card">
                  <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    className="product-image"
                  />

                  {p.salePriceMin && (
                    <span className="sale-badge">
                      -
                      {Math.round(
                        ((p.priceMin - p.salePriceMin) / p.priceMin) * 100
                      )}
                      %
                    </span>
                  )}

                  <div className="p-3">
                    <h5 className="text-truncate">{p.name}</h5>

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

                    <div className="rating">
                      <span>
                        ⭐{" "}
                        {p.averageRating != null
                          ? p.averageRating.toFixed(1)
                          : "0.0"}
                      </span>{" "}
                      <span className="review-count">
                        ({p.totalReviews || 0} đánh giá)
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
