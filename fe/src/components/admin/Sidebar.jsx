import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const Sidebar = ({ collapsed, onSelectMenu }) => {
  const menuItems = [
    {
      key: "dashboard",
      icon: "tachometer-alt",
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      key: "products",
      icon: "box",
      label: "Quản lý Sản phẩm",
      to: "/product-management",
    },
    {
      key: "orders",
      icon: "shopping-cart",
      label: "Quản lý Đơn hàng",
      to: "/ordermanagement",
    },
    {
      key: "customermanagement",
      icon: "users",
      label: "Quản lý Khách hàng",
      to: "/customermanagement",
    },
    {
      key: "collectionmanagement",
      icon: "tags",
      label: "Quản lí bộ sưu tập",
      to: "/collectionmanagement",
    },
    {
      key: "reports&statistics",
      icon: "chart-bar",
      label: "Báo cáo & Thống kê",
      to: "/reports&statistics",
    },
  ];
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [openProducts, setOpenProducts] = useState(false);
  const location = useLocation();

  // CSS inline
  const styles = {
    sidebar: {
      width: collapsed ? "80px" : "250px",
      minHeight: "100vh",
      background: "#000",
      transition: "width 0.3s ease",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      height: "46px",
      borderRadius: "6px",
      transition: "all 0.2s ease",
      textDecoration: "none",
      fontSize: "14px",
      color: "white",
    },
    iconBox: {
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    icon: {
      fontSize: "16px",
      lineHeight: "1",
    },
    activeStyle: {
      background: "white",
      color: "#bc4a1dff",
    },
  };

  useEffect(() => {
  if (location.pathname.startsWith('/product-management')) {
    setOpenProducts(true);     // luôn mở khi ở nhánh product-management
  }
}, [location.pathname]);

  return (
    <div className="d-flex flex-column text-white" style={styles.sidebar}>
      {/* Logo */}
      <div
        className="d-flex align-items-center justify-content-center border-bottom border-secondary"
        style={{ height: "64px" }}
      >
        <img
          src={
            collapsed ? "/images/logoVuongDen.png" : "/images/LogoNgangDen.png"
          }
          alt="Logo"
          style={{
            width: collapsed ? "48px" : "190px",
            aspectRatio: collapsed ? "1 / 1" : "3 / 1",
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* Menu */}
      <nav className="flex-grow-1 overflow-x-hidden py-3">
        <ul className="nav flex-column">
          {menuItems.map(({ key, icon, label, to }) => {
            if (key === "products") {
              return (
                <li key={key} className="nav-item px-2">
                  <div
                    role="button"
                    onClick={() => {
                      setOpenProducts((v) => !v);
                      onSelectMenu && onSelectMenu(key);
                    }}
                    style={{
                      ...styles.menuItem,
                      cursor: "pointer",
                      justifyContent: collapsed ? "center" : "flex-start",
                    }}
                  >
                    <span style={styles.iconBox}>
                      <i className={`fas fa-${icon}`} style={styles.icon} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-grow-1">Quản lý Sản phẩm</span>
                        <i
                          className={`fas fa-chevron-${
                            openProducts ? "down" : "right"
                          }`}
                          style={{ fontSize: "12px" }}
                        />
                      </>
                    )}
                  </div>

                  {/* submenu */}
                  {!collapsed && openProducts && (
                    <ul className="nav flex-column mt-1">
                      {[
                        {
                          key: "product-list",
                          label: "Sản phẩm",
                          to: "/product-management/products", end: true,
                        },
                        {
                          key: "product-attributes",
                          label: "Thuộc tính",
                          to: "/product-management/attributes", end: true,
                        },
                        {
                          key: "product-options",
                          label: "Option",
                          to: "/product-management/options", end: true,
                        },
                      ].map((sub) => (
                        <li key={sub.key} className="nav-item px-2">
                          <NavLink
                            to={sub.to}
                            end={sub.end}
                            className={({ isActive }) =>
                              `nav-link d-flex align-items-center rounded ms-4 ${
                                isActive ? "bg-white" : "text-white"
                              }`
                            }
                            style={({ isActive }) =>
                              isActive
                                ? {
                                    ...styles.menuItem,
                                    ...styles.activeStyle,
                                    height: "40px",
                                  }
                                : { ...styles.menuItem, height: "40px" }
                            }
                            onClick={() =>
                              onSelectMenu && onSelectMenu(sub.key)
                            }
                          >
                            <div style={{ ...styles.iconBox, width: "30px" }}>
                              <i
                                className="far fa-circle"
                                style={{ fontSize: 10 }}
                              />
                            </div>
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={key} className="nav-item px-2">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `nav-link rounded d-flex align-items-center ${
                      isActive ? "bg-white" : "text-white"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          ...styles.menuItem,
                          ...styles.activeStyle,
                          justifyContent: collapsed ? "center" : "flex-start",
                        }
                      : {
                          ...styles.menuItem,
                          justifyContent: collapsed ? "center" : "flex-start",
                        }
                  }
                  onClick={() => onSelectMenu && onSelectMenu(key)}
                >
                  <div style={styles.iconBox}>
                    <i className={`fas fa-${icon}`} style={styles.icon} />
                  </div>
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-top border-secondary">
        <button
          className="btn btn-link text-white text-decoration-none w-100 d-flex align-items-center"
          style={{
            ...styles.menuItem,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onClick={async () => {
            try {
              await logout(); // ⬅️ gọi logout() từ AuthContext (xoá cookie + clear state)
            } finally {
              window.location.replace("/"); // ⬅️ quay lại trang chủ
            }
          }}
        >
          <div style={styles.iconBox}>
            <i className="fas fa-sign-out-alt" style={styles.icon} />
          </div>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
