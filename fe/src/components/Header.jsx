import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import TopBanner from "./TopBanner";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";

function Header({ setShowLoginModal, setShowSearch }) {
  const [categories, setCategories] = useState([]);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const navigate = useNavigate();

  // ===== AUTH =====
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("login"); // 'login' | 'register'

  const displayName = user?.email ? user.email.split("@")[0] : "Tài khoản";

  async function handleLogout() {
    try {
      await logout();
    } finally {
      window.location.replace("/");
    }
  }

  // ===== LẤY CATEGORY TỪ BE =====
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/public/categories");
        if (!response.ok) {
          throw new Error("Lỗi khi gọi API categories");
        }
        const data = await response.json(); // [{ id, name, slug, parentId, displayOrder }]
        setCategories(data);
        localStorage.setItem("navItems", JSON.stringify(data));
      } catch (error) {
        console.error("Lỗi khi lấy categories:", error);
        const cached = localStorage.getItem("navItems");
        if (cached) {
          try {
            setCategories(JSON.parse(cached));
          } catch (_) {}
        }
      }
    };

    fetchCategories();
  }, []);

  // sort theo displayOrder
  const sortedCategories = useMemo(() => {
    const clone = [...categories];
    clone.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return clone;
  }, [categories]);

  // category cha
  const rootCategories = useMemo(
    () => sortedCategories.filter((c) => !c.parentId),
    [sortedCategories]
  );

  // map parentId -> list con
  const childrenByParent = useMemo(() => {
    const map = new Map();
    sortedCategories.forEach((c) => {
      if (c.parentId) {
        const arr = map.get(c.parentId) || [];
        arr.push(c);
        map.set(c.parentId, arr);
      }
    });
    return map;
  }, [sortedCategories]);

  // ===== Ẩn / hiện header khi scroll =====
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ===== CLICK CART =====
  function handleCartClick(e) {
    if (!user) {
      e.preventDefault();
      setInitialTab("login");
      setAuthOpen(true);
      if (typeof setShowLoginModal === "function") {
        setShowLoginModal(true);
      }
    }
  }

  return (
    <>
      <header
        className={`main-header ${visible ? "shown" : "hidden"}`}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 999,
          width: "100vw",
        }}
      >
        <TopBanner />

        {/* ===== THANH TRÊN: LOGO + SEARCH + ACTIONS ===== */}
        <div
          className="container-fluid fixed-header"
          style={{
            backgroundColor: "#ffffffff",
            paddingRight: "3%",
            paddingLeft: "3%",
          }}
        >
          <div className="row">
            {/* Logo */}
            <div className="col-3 text-start">
              <a href="/">
                <img
                  src="/images/LogoNgang.png"
                  alt="Home"
                  style={{
                    width: "max-content",
                    height: "90px",
                  }}
                  className="card-img-top"
                />
              </a>
            </div>

            {/* Search */}
            <div className="col-5 d-flex justify-content-center align-items-center">
              <form
                className="w-100 d-flex justify-content-center"
                role="search"
                style={{ maxWidth: "100%" }}
              >
                <div className="flex-grow-1 mx-2" style={{ maxWidth: "24rem" }}>
                  <div className="position-relative border rounded-pill px-2 py-0 border-secondary bg-white">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 rounded-pill ps-2 pe-4 py-1"
                      placeholder="Tìm kiếm sản phẩm..."
                      onClick={() => setShowSearch?.(true)}
                      style={{
                        boxShadow: "none",
                        backgroundColor: "transparent",
                      }}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                      style={{ zIndex: 5 }}
                      aria-label="Search"
                      onClick={() => setShowSearch?.(true)}
                    >
                      <i className="fas fa-search small"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Actions */}
            <div
              className="col-4 d-flex justify-content-end align-items-center"
              style={{ color: "black" }}
            >
              {/* Giỏ hàng */}
              <Link
                to={user ? "/cart" : "#"}
                className="btn"
                onClick={handleCartClick}
                style={{ paddingRight: "0px" }}
              >
                <i
                  className="fa-solid fa-cart-shopping"
                  style={{ fontSize: 20 }}
                ></i>
              </Link>

              {/* Tài khoản */}
              <div
                className="ms-3"
                style={{ marginLeft: 40, marginRight: 20 }}
              >
                <div className="sign-in-up-btns">
                  {!user ? (
                    // Chưa đăng nhập
                    <div className="dropdown">
                      <button
                        className="btn btn-light dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="userDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{
                          fontSize: 16,
                          backgroundColor: "#ffffffff",
                          border: "none",
                          boxShadow: "none",
                          color: "black",
                          paddingLeft: 0,
                          paddingRight: 0,
                        }}
                      >
                        <i
                          className="fa-solid fa-user me-2"
                          style={{ fontSize: 20, color: "black" }}
                        ></i>
                        Tài khoản
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="userDropdown"
                        style={{
                          minWidth: "120px",
                          fontSize: "13px",
                          padding: 0,
                        }}
                      >
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setInitialTab("login");
                              setAuthOpen(true);
                            }}
                          >
                            <i className="fa-solid fa-right-to-bracket"></i>{" "}
                            Đăng nhập
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setInitialTab("register");
                              setAuthOpen(true);
                            }}
                          >
                            <i className="fa-solid fa-user-plus"></i> Đăng ký
                          </button>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    // Đã đăng nhập
                    <div className="dropdown">
                      <button
                        className="btn btn-light dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="userDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{
                          fontSize: 16,
                          backgroundColor: "#ffffffff",
                          border: "none",
                          boxShadow: "none",
                          color: "black",
                          paddingLeft: 0,
                          paddingRight: 0,
                        }}
                      >
                        <i
                          className="fa-solid fa-user me-2"
                          style={{ fontSize: 20, color: "black" }}
                        ></i>
                        {displayName}
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="userDropdown"
                        style={{
                          minWidth: "120px",
                          fontSize: "13px",
                          padding: 0,
                        }}
                      >
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate("/me");
                            }}
                          >
                            <i className="fa-regular fa-user"></i> Thông tin cá
                            nhân
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={handleLogout}
                          >
                            <i className="fa-solid fa-right-from-bracket"></i>{" "}
                            Đăng xuất
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== NAVBAR + DROPDOWN 1 CỘT ===== */}
        <style>{`
  .navbar-nav {
    background-color: #004aad;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .navbar-nav .nav-item {
    position: relative;
    margin: 0 1.5rem;
  }

  .navbar-nav .nav-link {
    display: inline-block;
    text-transform: uppercase;
    font-size: 18px;
    color: #ffffff;
    padding: 0.75rem 0;
    position: relative;
    cursor: default;
  }

  .navbar-nav .nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background-color: #f15a24;
    border-radius: 2px;
    transition: width 0.3s;
  }

  .navbar-nav .nav-item:hover .nav-link::after,
  .navbar-nav .nav-link.active::after {
    width: 100%;
  }

  .mega-menu {
    position: absolute;
    top: 45px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 220px;
    background: #ffffff;
    margin-top: 6px;
    border-radius: 10px;
    padding: 8px 0;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    display: none;
    z-index: 999;
  }

  .nav-item:hover .mega-menu {
    display: block;
  }

  .mega-menu a {
    display: block;
    padding: 7px 18px;
    font-size: 15px;
    color: #004aad;
    text-decoration: none;
    white-space: nowrap;
  }

  .mega-menu a:hover {
    background: #f3f6ff;
    color: #004aad;
  }

  @media (max-width: 768px) {
    .navbar-nav {
      flex-wrap: wrap;
    }
    .navbar-nav .nav-item {
      margin: 0.5rem;
    }
    .mega-menu {
      left: 0;
      transform: none;
    }
  }
`}</style>

        <ul className="navbar-nav">
          {rootCategories.map((root) => {
            const children = childrenByParent.get(root.id) || [];
            return (
              <li key={root.id} className="nav-item">
                <span className="nav-link">{root.name}</span>

                {children.length > 0 && (
                  <div className="mega-menu">
                    {children.map((child) => (
                      <a key={child.id} href={`/category/${child.slug}`}>
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </header>

      {/* Modal Auth (login / register) */}
      {authOpen && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialTab={initialTab}
        />
      )}
    </>
  );
}

export default Header;
