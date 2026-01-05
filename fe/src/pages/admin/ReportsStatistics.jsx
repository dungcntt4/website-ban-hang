import Sidebar from "../../components/admin/Sidebar.jsx";
import React, { useEffect, useState } from "react";
import * as echarts from "echarts";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { apiFetch } from "../../api/client";

function ReportsStatistics() {
  // Sidebar & Header states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("reports&statistics");
  const [notificationCount, setNotificationCount] = useState(5);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [dateRange, setDateRange] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // State dữ liệu từ backend
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    totalProfit: 0,
  });
  const [revenueData, setRevenueData] = useState({ dates: [], values: [] });
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);

  // Toggle sidebar / user dropdown
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);

  // Format tiền
  const formatCurrency = (value) => {
    return value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
  };

  // Đổi khoảng thời gian lọc
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setShowCustomDatePicker(range === "custom");
  };

  // Gọi API lấy dữ liệu dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let url = `/api/admin/dashboard/stats`;
        const params = new URLSearchParams();

        if (dateRange !== "custom") {
          const now = new Date();
          let startDate = "",
            endDate = "";

          switch (dateRange) {
            case "today":
              startDate = endDate = formatDate(now);
              break;

            case "week":
              const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
              const monday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - dayOfWeek + 1
              );
              startDate = formatDate(monday);
              endDate = formatDate(now);
              break;

            case "month":
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
              startDate = formatDate(firstDay);
              endDate = formatDate(now);
              break;
          }

          params.append("startDate", startDate);
          params.append("endDate", endDate);
        } else if (customDateRange.startDate && customDateRange.endDate) {
          params.append("startDate", customDateRange.startDate);
          params.append("endDate", customDateRange.endDate);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await apiFetch(url);
        const data = await res.json();

        console.log("Dashboard data:", data);

        setSummaryStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProductsSold: data.totalProductsSold || 0,
          totalProfit: data.totalProfit || 0,
        });

        setRevenueData({
          dates: data.revenueDates || [],
          values: data.revenueValues || [],
        });

        setOrderStatusData(
          Object.keys(data.orderStatusRatios || {}).map((key) => ({
            name: statusLabelMap[key] || key,
            raw: key,
            value: data.orderStatusRatios[key],
          }))
        );

        setTopProductsData(data.topProducts || []);
      } catch (err) {
        console.error("Lỗi fetch dashboard:", err);
      }
    };

    fetchDashboard();
  }, [dateRange, customDateRange]);

  // useEffect vẽ biểu đồ
  useEffect(() => {
    if (!revenueData.dates.length) return;

    const revenueChartDom = document.getElementById("revenue-chart");
    let revenueChart =
      echarts.getInstanceByDom(revenueChartDom) ||
      echarts.init(revenueChartDom);

    revenueChart.setOption({
      animation: false,
      tooltip: {
        trigger: "axis",
        formatter: function (params) {
          const value = params[0].value;
          return `${params[0].axisValue} : ${formatCurrency(value)}`;
        },
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "category", boundaryGap: false, data: revenueData.dates },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (v) => (v / 1000000).toFixed(1) + "M" },
      },
      series: [
        {
          name: "Doanh thu",
          type: "line",
          data: revenueData.values,
          smooth: true,
          lineStyle: { width: 3, color: "#3B82F6" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.05)" },
              ],
            },
          },
        },
      ],
    });

    const orderStatusChartDom = document.getElementById("order-status-chart");
    let orderStatusChart =
      echarts.getInstanceByDom(orderStatusChartDom) ||
      echarts.init(orderStatusChartDom);
    orderStatusChart.setOption({
      animation: false,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: {
        orient: "vertical",
        right: 2,
        top: "center",
        data: orderStatusData.map((i) => i.name),
      },
      series: [
        {
          type: "pie",
          radius: ["50%", "70%"],
          center: ["40%", "50%"],
          avoidLabelOverlap: false,
          label: { show: false, position: "center" },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
          labelLine: { show: false },
          data: orderStatusData.map((i) => ({
            value: i.value,
            name: i.name,
            itemStyle: { color: colorMapping(i.raw) },
          })),
        },
      ],
    });
    // Mảng tên đầy đủ để map vào tooltip
    const topProductsChartDom = document.getElementById("top-products-chart");
    let topProductsChart =
      echarts.getInstanceByDom(topProductsChartDom) ||
      echarts.init(topProductsChartDom);

    const fullProductNames = topProductsData.map((i) => i.name).reverse();

    topProductsChart.setOption({
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const index = params[0].dataIndex;
          return `${fullProductNames[index]}<br/>Số lượng bán: ${params[0].value}`;
        },
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "value",
        minInterval: 1, // Không có số lẻ trên trục X
        axisLabel: {
          formatter: (value) => Math.round(value),
        },
      },
      yAxis: {
        type: "category",
        data: fullProductNames.map((name) => truncateText(name, 20)),
        axisLabel: {
          formatter: (value) => truncateText(value, 20),
        },
      },
      series: [
        {
          name: "Số lượng bán",
          type: "bar",
          data: topProductsData.map((i) => i.value).reverse(),
          itemStyle: { color: "#8B5CF6" },
        },
      ],
    });

    const handleResize = () => {
      try {
        revenueChart.resize();
      } catch {}
      try {
        orderStatusChart.resize();
      } catch {}
      try {
        topProductsChart.resize();
      } catch {}
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        revenueChart.dispose();
      } catch {}
      try {
        orderStatusChart.dispose();
      } catch {}
      try {
        topProductsChart.dispose();
      } catch {}
    };
  }, [revenueData, orderStatusData, topProductsData]);

  // Màu biểu đồ pie chart
  const colorMapping = (status) => {
    switch (status) {
      case "DA_THANH_TOAN":
        return "#10B981";
      case "CHO_THANH_TOAN":
        return "#FACC15";
      case "HUY_THANH_TOAN":
        return "#9CA3AF";
      case "THANH_TOAN_THAT_BAI":
        return "#EF4444";
      default:
        return "#CBD5E1";
    }
  };
  const statusLabelMap = {
    DA_THANH_TOAN: "Đã thanh toán",
    CHO_THANH_TOAN: "Chờ thanh toán",
    HUY_THANH_TOAN: "Huỷ thanh toán",
    THANH_TOAN_THAT_BAI: "Thanh toán thất bại",
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const exportToExcel = () => {
    // Tính ngày bắt đầu & kết thúc hiển thị theo bộ lọc
    let displayStartDate = "";
    let displayEndDate = "";

    const now = new Date();
    switch (dateRange) {
      case "today":
        displayStartDate = displayEndDate = formatDate(now);
        break;
      case "week":
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const monday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - dayOfWeek + 1
        );
        displayStartDate = formatDate(monday);
        displayEndDate = formatDate(now);
        break;
      case "month":
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        displayStartDate = formatDate(firstDay);
        displayEndDate = formatDate(now);
        break;
      case "custom":
        displayStartDate = customDateRange.startDate;
        displayEndDate = customDateRange.endDate;
        break;
      default:
        displayStartDate = "";
        displayEndDate = "";
    }

    // Tạo dữ liệu xuất file
    const data = [
      ["BÁO CÁO THỐNG KÊ"],
      [],
      ["Khoảng thời gian:", `${displayStartDate} - ${displayEndDate}`],
      [],
      ["Chỉ số", "Giá trị"],
      ["Tổng doanh thu", summaryStats.totalRevenue],
      ["Tổng đơn hàng thành công", summaryStats.totalOrders],
      ["Sản phẩm đã bán", summaryStats.totalProductsSold],
      ["Tổng lợi nhuận", summaryStats.totalProfit],
      [],
      ["Top 5 sản phẩm bán chạy"],
      ["Tên sản phẩm", "Số lượng bán"],
      ...topProductsData.map((p) => [p.name, p.value]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(
      fileData,
      `bao_cao_thong_ke_${displayStartDate}_den_${displayEndDate}.xlsx`
    );
  };

  return (
    <div className="d-flex vh-100 bg-light text-dark">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        activeMenu={activeMenu}
        onToggle={toggleSidebar}
        onSelectMenu={setActiveMenu}
        notificationCount={notificationCount}
        showUserDropdown={showUserDropdown}
        toggleUserDropdown={toggleUserDropdown}
      />

      {/* Main content */}
      <div className="flex-grow-1 d-flex flex-column">
        <HeaderAdmin
          title="Báo cáo & Thống kê"
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
        />

        {/* Main area */}
        <main className="flex-grow-1 overflow-auto bg-light">
          <div className="p-4">
            {/* Bộ lọc ngày & Xuất file */}
            <div className="bg-white rounded shadow-sm p-3 d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select"
                  style={{ width: "150px" }}
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="custom">Tùy chọn</option>
                </select>
                {showCustomDatePicker && (
                  <>
                    <div className="d-flex align-items-center ms-3">
                      <label className="me-2 mb-0">Từ:</label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ width: "150px" }}
                        value={customDateRange.startDate}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="d-flex align-items-center ms-3">
                      <label className="me-2 mb-0">Đến:</label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ width: "150px" }}
                        value={customDateRange.endDate}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              <div>
                <button
                  className="btn btn-success me-2"
                  onClick={exportToExcel}
                >
                  <i className="fas fa-file-excel me-2"></i>Xuất Excel
                </button>
              </div>
            </div>

            {/* Summary Stats Cards */}
            <div className="row mb-4">
              {/* Doanh thu */}
              <div className="col-md-3 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Doanh thu</small>
                    <i className="fas fa-money-bill-wave text-primary"></i>
                  </div>
                  <h4 className="fw-bold">
                    {formatCurrency(summaryStats.totalRevenue)}
                  </h4>
                </div>
              </div>
              {/* Số đơn hàng */}
              <div className="col-md-3 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Số đơn hàng thành công</small>
                    <i className="fas fa-shopping-cart text-warning"></i>
                  </div>
                  <h4 className="fw-bold">{summaryStats.totalOrders}</h4>
                </div>
              </div>
              {/* Sản phẩm đã bán */}
              <div className="col-md-3 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Sản phẩm đã bán</small>
                    <i className="fas fa-box text-purple"></i>
                  </div>
                  <h4 className="fw-bold">{summaryStats.totalProductsSold}</h4>
                </div>
              </div>
              {/* Lợi nhuận */}
              <div className="col-md-3 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Lợi nhuận</small>
                    <i className="fas fa-chart-line text-success"></i>
                  </div>
                  <h4 className="fw-bold">
                    {formatCurrency(summaryStats.totalProfit)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Biểu đồ: Doanh thu theo thời gian */}
            <div className="bg-white rounded shadow-sm p-3 mb-4">
              <h5 className="mb-3">Doanh thu theo thời gian</h5>
              <div id="revenue-chart" style={{ height: "400px" }}></div>
            </div>

            {/* Biểu đồ: Order status & Top products */}
            <div className="row mb-4">
              <div className="col-lg-6 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <h5 className="mb-3">Tỷ lệ đơn hàng theo trạng thái</h5>
                  <div
                    id="order-status-chart"
                    style={{ height: "300px" }}
                  ></div>
                </div>
              </div>
              <div className="col-lg-6 mb-3">
                <div className="bg-white rounded shadow-sm p-3">
                  <h5 className="mb-3">Top 5 sản phẩm bán chạy</h5>
                  <div
                    id="top-products-chart"
                    style={{ height: "300px" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Nếu muốn thêm bảng chi tiết đơn hàng, có thể bổ sung dưới đây */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportsStatistics;
