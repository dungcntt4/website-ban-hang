// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";
import Sidebar from "../../components/admin/Sidebar.jsx"; // <-- import đúng đường dẫn
import OrderDetails from '../../components/OrderDetails';
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import { apiFetch } from "../../api/client";
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModalOrder, setShowModalOrder] = useState(false);
  const [orderDT, setOrderDT] = useState(null);
  const showToast = async () => {
    const toastEl = document.getElementById("success-toast");
    if (toastEl) {
      const toastModule = await import("bootstrap/js/dist/toast");
      const ToastClass = toastModule.default;
      const toast = new ToastClass(toastEl);
      toast.show();
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const success = localStorage.getItem("loginSuccess");
    if (success === "true") {
      setTimeout(() => {
        showToast();
      }, 0);
      localStorage.removeItem("loginSuccess");
    }
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [notificationCount, setNotificationCount] = useState(5);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchDataAndRenderChart = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await apiFetch("/api/admin/dashboard/monthly-revenue");

        const data = await res.json(); // { "T7": 1000, "T8": 2000, ... }

        const months = Object.keys(data);
        const revenues = Object.values(data);

        const chartDom = document.getElementById("revenue-chart");
        if (chartDom) {
          const myChart = echarts.init(chartDom);
          const option = {
            animation: false,
            tooltip: {
              trigger: "axis",
              axisPointer: { type: "shadow" },
            },
            grid: {
              left: "3%",
              right: "4%",
              bottom: "3%",
              containLabel: true,
            },
            xAxis: {
              type: "category",
              data: months,
              axisTick: { alignWithLabel: true },
            },
            yAxis: { type: "value" },
            series: [
              {
                name: "Doanh thu",
                type: "bar",
                barWidth: "60%",
                data: revenues,
                itemStyle: { color: "#ede734" },
              },
            ],
          };

          myChart.setOption(option);

          const handleResize = () => myChart.resize();
          window.addEventListener("resize", handleResize);

          return () => {
            window.removeEventListener("resize", handleResize);
            myChart.dispose();
          };
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu doanh thu:", error);
      }
    };

    fetchDataAndRenderChart();
  }, []);
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
  });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await apiFetch("/api/admin/dashboard/summary");
        const data = await res.json();

        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalCustomers: data.totalCustomers || 0,
          recentOrders: data.recentOrders || [],
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu tổng quan:", error);
      }
    };

    fetchStats();
  }, []);

  const statusBadge = {
    "Hoàn thành": "success",
    "Đang xử lý": "warning",
    "Đã hủy": "danger",
  };
  const convertStatus = (status) => {
  switch (status) {
    case "DA_THANH_TOAN":
      return "Hoàn thành";
    case "CHO_THANH_TOAN":
      return "Đang xử lý";
    case "THANH_TOAN_THAT_BAI":
    case "HUY_THANH_TOAN":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
};
  const formatCurrencyShort = (value) => {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + " tỷ";
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + " triệu";
    }
    return value.toLocaleString() + " VNĐ";
  };
  const handleViewOrderDT = (orderId) => {
    const order = stats.recentOrders.find(o => o.orderCode === orderId);
    setOrderDT(order);
};

  return (
    <>
      {/* Toast for login success */}
      <div
        id="success-toast"
        className="toast position-fixed bottom-0 end-0 text-white bg-success m-3"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          zIndex: 9999,
          minWidth: 250,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <div className="d-flex align-items-center">
          <div className="toast-body">Đăng nhập thành công!</div>
          <button
            type="button"
            className="btn-close btn-close-white ms-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>




      <div className="d-flex vh-100 bg-light text-dark">
        {/* Gọi component Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          activeMenu={activeMenu}
          onToggle={toggleSidebar}
          onSelectMenu={setActiveMenu}
          notificationCount={notificationCount}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden">
          {/* Header */}
          <HeaderAdmin
                    title="Trang quản trị"
                    sidebarCollapsed={sidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                    showUserDropdown={showUserDropdown}
                    toggleUserDropdown={toggleUserDropdown}
          />

          {/* Main Content Area */}
          <main className="flex-grow-1 overflow-auto bg-light p-4">
            {/* Stats */}
            <div className="mb-4">
              <h2 className="mb-4">Tổng quan</h2>
              <div className="row g-3">
                {/* Card 1 */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-shopping-bag text-primary fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-1 small">Tổng đơn hàng</p>
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">{stats.totalOrders}</h3>
                          {/* <span className="text-success ms-2 small d-flex align-items-center">
                            <i className="fas fa-arrow-up me-1"></i>12.5%
                          </span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-dollar-sign text-warning fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-1 small">Doanh thu</p>
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">{formatCurrencyShort(stats.totalRevenue)}</h3>
                          {/* <span className="text-danger ms-2 small d-flex align-items-center">
                            <i className="fas fa-arrow-down me-1"></i>5.3%
                          </span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-users text-success fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-1 small">Khách hàng</p>
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">{stats.totalCustomers}</h3>
                          {/* <span className="text-success ms-2 small d-flex align-items-center">
                            <i className="fas fa-arrow-up me-1"></i>3.9%
                          </span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-box-open text-info fs-4"></i>
                      </div>
                      <div>
                        <p className="text-muted mb-1 small">Sản phẩm</p>
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">{stats.totalProducts}</h3>
                          {/* <span className="text-warning ms-2 small d-flex align-items-center">
                            <i className="fas fa-arrow-down me-1"></i>1.2%
                          </span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-4">
              <h2 className="mb-3">Doanh thu tháng</h2>
              <div id="revenue-chart" style={{ height: "300px", width: "100%" }}></div>
            </div>

            {/* Recent Orders */}
            <div>
              <h2 className="mb-3">Đơn hàng gần đây</h2>
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.orderCode}</td>
                        <td>{order.userName}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="">{order.totalAmount.toLocaleString()} VNĐ</td>
                        <td>
                          <span className={`badge bg-${statusBadge[convertStatus(order.status)] || "secondary"}`}>
                            {convertStatus(order.status)}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-link text-dark p-0 "onClick={() => {
                                                                    setShowModalOrder(true);
                                                                    handleViewOrderDT(order.orderCode);
                                                                }}>
                            <i className="fas fa-eye"></i>
                          </button>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
      {showModalOrder && (
                        <OrderDetails
                            orderDT={orderDT}
                            onClose={() => setShowModalOrder(false)}
                        />
                    )}
    </>
  );
}

export default Dashboard;

