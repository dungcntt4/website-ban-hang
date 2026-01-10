// src/pages/admin/OrderManagement.jsx

import { apiFetch } from "../../api/client";
import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import OrderDetails from "../../components/OrderDetails";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import HeaderAdmin from "../../components/admin/HeaderAdmin.jsx";
const OrderManagement = () => {
  // Các state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("orders");
  const [notificationCount, setNotificationCount] = useState(5);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);

  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalOrder, setShowModalOrder] = useState(false);
  const [orderDT, setOrderDT] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const ordersPerPage = 5;
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentDate, setCurrentDate] = useState("");

  // Toggle functions
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);

  const toggleStatusDropdown = () => {
    setShowStatusDropdown(!showStatusDropdown);
    if (showDateRangeDropdown) setShowDateRangeDropdown(false);
  };
  const toggleDateRangeDropdown = () => {
    setShowDateRangeDropdown(!showDateRangeDropdown);
    if (showStatusDropdown) setShowStatusDropdown(false);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      // dateRange → fromDate, toDate (convert trước)
      if (dateRangeFilter !== "all") {
        const { fromDate, toDate } = convertDateRange(dateRangeFilter);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
      }

      const res = await apiFetch(`/api/orders?${params.toString()}`);

      if (!res.ok) throw new Error("Fetch orders failed");

      const data = await res.json();

      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý cập nhật trạng thái đơn hàng
  const handleUpdateStatusClick = (id) => {
    setOrderToUpdate(id);
    setNewStatus("");
    setShowUpdateStatusModal(true);
  };

  const cancelUpdateStatus = () => {
    setShowUpdateStatusModal(false);
    setOrderToUpdate(null);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, dateRangeFilter]);

  // Các lựa chọn trạng thái
  const statuses = [
    "DA_THANH_TOAN",
    "CHO_THANH_TOAN",
    "THANH_TOAN_THAT_BAI",
    "HUY_THANH_TOAN",
  ];

  // Các lựa chọn khoảng thời gian
  const dateRanges = [
    { id: "all", name: "Tất cả thời gian" },
    { id: "today", name: "Hôm nay" },
    { id: "yesterday", name: "Hôm qua" },
    { id: "thisWeek", name: "Tuần này" },
    { id: "custom", name: "Tùy chỉnh..." },
  ];

  // Lọc đơn hàng theo search, status, date range

  // Color badge cho trạng thái
  const statusBadgeColor = {
    CHO_THANH_TOAN: "warning", // chờ thanh toán
    DA_THANH_TOAN: "success", // đã thanh toán
    HUY_THANH_TOAN: "secondary", // huỷ thanh toán
    THANH_TOAN_THAT_BAI: "danger", // thanh toán thất bại
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    // Lấy ngày hiện tại
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setCurrentDate(formattedDate);
  }, []);

  const handleViewOrder = (orderId) => {
    const order = orders.find((o) => o.orderCode === orderId);
    setSelectedOrder(order);
  };
  const handlePrint = () => {
    window.print();
  };
  const convertNumberToVietnameseWords = (number) => {
    const ChuSo = [
      "không",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];
    const Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    if (number === 0) return "Không đồng";

    function DocSo3ChuSo(baso) {
      let tram = Math.floor(baso / 100);
      let chuc = Math.floor((baso % 100) / 10);
      let donvi = baso % 10;
      let ketQua = "";

      if (tram !== 0) {
        ketQua += ChuSo[tram] + " trăm";
        if (chuc === 0 && donvi !== 0) ketQua += " linh";
      }

      if (chuc !== 0 && chuc !== 1) {
        ketQua += " " + ChuSo[chuc] + " mươi";
        if (donvi === 1) ketQua += " mốt";
      } else if (chuc === 1) {
        ketQua += " mười";
        if (donvi === 1) ketQua += " một";
      }

      if (chuc !== 0 && donvi === 5) {
        ketQua += " lăm";
      } else if (donvi !== 0 && !(chuc === 1 && donvi === 1)) {
        ketQua += " " + ChuSo[donvi];
      }

      return ketQua.trim();
    }

    let i = 0;
    let so = number;
    let ketQua = "";

    while (so > 0) {
      let soBaChuSo = so % 1000;
      so = Math.floor(so / 1000);

      if (soBaChuSo !== 0) {
        let tien = Tien[i];
        let doc = DocSo3ChuSo(soBaChuSo);
        ketQua = doc + " " + tien + " " + ketQua;
      }

      i++;
    }

    ketQua = ketQua.replace(/\s+/g, " ").trim();
    ketQua = ketQua.charAt(0).toUpperCase() + ketQua.slice(1) + " đồng";

    return ketQua;
  };

  const handleViewOrderDT = (orderId) => {
    const order = orders.find((o) => o.orderCode === orderId);
    setOrderDT(order);
  };
  const confirmUpdateStatus = async () => {
    if (!newStatus || !orderToUpdate) return;
const order = orders.find((o) => o.orderCode === orderToUpdate);

  if (!order || ["DA_THANH_TOAN", "HUY_THANH_TOAN"].includes(order.status)) {
    setToastType("danger");
    setToastMessage(
      "Đơn hàng đã thanh toán hoặc đã huỷ, không thể cập nhật trạng thái"
    );
    setShowToast(true);
    setShowUpdateStatusModal(false);
    return;
  }
    try {
      const res = await apiFetch(`/api/orders/${orderToUpdate}/status`, {
        method: "PUT",
        body: JSON.stringify({ newStatus }),
      });

      if (!res.ok) {
        throw new Error("Update status failed");
      }

      // cập nhật FE state
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === orderToUpdate ? { ...o, status: newStatus } : o
        )
      );

      setShowUpdateStatusModal(false);
      setToastMessage(`Cập nhật trạng thái ${orderToUpdate} thành công`);
      setToastType("success");
    } catch (err) {
      console.error("Lỗi update status:", err);
      setToastMessage("Lỗi cập nhật trạng thái đơn hàng");
      setToastType("danger");
    } finally {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const exportToExcel = () => {
    if (orders.length === 0) return;

    const dataToExport = orders.map((order, index) => ({
      STT: index + 1,
      "Mã đơn hàng": order.orderCode,
      "Khách hàng": order.userName,
      SĐT: order.userPhoneNumber,
      "Ngày đặt": new Date(order.createdAt).toLocaleDateString("vi-VN"),
      "Tổng tiền": Math.round(order.totalAmount).toLocaleString("vi-VN"),
      "Trạng thái": order.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DonHang");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "don-hang.xlsx");
  };
  function convertDateRange(type) {
    const today = new Date();

    if (type === "today") {
      const d = today.toISOString().split("T")[0];
      return { fromDate: d, toDate: d };
    }

    if (type === "yesterday") {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const d = y.toISOString().split("T")[0];
      return { fromDate: d, toDate: d };
    }

    if (type === "thisWeek") {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        fromDate: monday.toISOString().split("T")[0],
        toDate: sunday.toISOString().split("T")[0],
      };
    }

    return {};
  }

  return (
    <>
      {selectedOrder ? (
        <div className="print-container bg-white container my-5 p-4 shadow w-720">
          <div className="print-controls mb-4 d-flex justify-content-between align-items-center d-print-none">
            <button
              onClick={() => setSelectedOrder(null)}
              className="btn btn-secondary d-flex align-items-center"
            >
              <i className="fas fa-arrow-left me-2"></i> Quay lại
            </button>
            <div className="d-flex gap-2">
              <button
                onClick={handlePrint}
                className="btn btn-primary d-flex align-items-center"
              >
                <i className="fas fa-print me-2"></i> In hóa đơn
              </button>
              <button className="btn btn-success d-flex align-items-center">
                <i className="fas fa-file-pdf me-2"></i> Lưu PDF
              </button>
            </div>
          </div>

          <div className="invoice-content">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div
                className="bg text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80 }}
              >
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ width: "auto", height: "90px" }}
                />
              </div>
              <div className="text-center flex-grow-1 mx-4">
                <h1 className="h4 fw-bold text-dark mb-1">HÓA ĐƠN BÁN HÀNG</h1>
                <p className="text-muted">
                  Mã hóa đơn:{" "}
                  <span className="fw-semibold">{selectedOrder.orderCode}</span>
                </p>
              </div>
              <div className="text-end">
                <p className="text-muted">
                  Ngày:{" "}
                  <span className="fw-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </p>
                <p className="text-muted">
                  Giờ in: <span className="fw-semibold">{currentDate}</span>
                </p>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="fw-bold border-bottom pb-1">
                  Thông tin người bán
                </h5>
                <p className="fw-semibold mb-1">Cửa hàng Huân Sports</p>
                <p className="text-muted mb-1">
                  Địa chỉ: Thôn Yên Quán, xã Hưng Đạo, huyện Quốc Oai, TP. Hà
                  Nội
                </p>
                <p className="text-muted mb-1">Điện thoại: 0983910JQK</p>
                <p className="text-muted">Mã số thuế: 0123456789</p>
              </div>
              <div className="col-md-6">
                <h5 className="fw-bold border-bottom pb-1">
                  Thông tin khách hàng
                </h5>
                <p className="fw-semibold mb-1">{selectedOrder.userName}</p>
                <p className="text-muted mb-1">
                  Địa chỉ: {selectedOrder.shippingAddress}
                </p>
                <p className="text-muted mb-1">
                  Điện thoại: {selectedOrder.userPhoneNumber}
                </p>
                <p className="text-muted">
                  Mã đơn hàng: {selectedOrder.orderCode}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="fw-bold border-bottom pb-1 mb-3">
                Chi tiết đơn hàng
              </h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>STT</th>
                      <th>Tên sản phẩm</th>
                      <th className="text-center">Thuộc tính</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((product, index) => (
                      <tr key={product.productVariantDTO.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>{product.productVariantDTO.productName}</td>
                        <td className="text-center">
                          {product.productVariantDTO.sku}
                        </td>
                        <td className="text-center">{product.quantity}</td>
                        <td className="text-end">
                          {Math.round(product.unitPrice).toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </td>
                        <td className="text-end">
                          {Math.round(product.totalPrice).toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="fw-bold border-bottom pb-1">Ghi chú</h5>
                <p className="text-muted">
                  Số tiền bằng chữ:{" "}
                  <span className="fw-semibold fst-italic">
                    {convertNumberToVietnameseWords(selectedOrder.totalAmount)}
                  </span>
                </p>
                <p className="text-muted mt-2">
                  Phương thức thanh toán:{" "}
                  <span className="fw-semibold">Đã thanh toán bằng VNPay</span>
                </p>
              </div>
              <div className="col-md-6">
                <h5 className="fw-bold border-bottom pb-1">Tổng thanh toán</h5>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Tổng tiền hàng:</span>
                  <span className="fw-semibold">
                    {Math.round(selectedOrder.totalAmount).toLocaleString(
                      "vi-VN"
                    )}
                    ₫
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Phí vận chuyển:</span>
                  <span className="fw-semibold">0₫</span>
                </div>
                <div className="d-flex justify-content-between py-2 fw-bold fs-5">
                  <span>Tổng thanh toán:</span>
                  <span>
                    {Math.round(selectedOrder.totalAmount).toLocaleString(
                      "vi-VN"
                    )}{" "}
                    VND
                  </span>
                </div>
              </div>
            </div>

            <div className="row mt-5">
              <div className="col-md-6 text-center">
                <p className="fw-semibold mb-2">Người bán</p>
                <p className="text-muted small mb-5">(Ký, ghi rõ họ tên)</p>
                <p className="fw-semibold">Nguyễn Văn Huân</p>
              </div>
              <div className="col-md-6 text-center">
                <p className="fw-semibold mb-2">Người mua</p>
                <p className="text-muted small mb-5">(Ký, ghi rõ họ tên)</p>
                <p className="fw-semibold">{selectedOrder.userName}</p>
              </div>
            </div>

            <div className="text-center mt-4 pt-3 border-top">
              <p className="text-muted">
                Cảm ơn Quý khách đã mua hàng tại cửa hàng chúng tôi!
              </p>
              <p className="text-muted mt-1">
                Mọi thắc mắc xin liên hệ:{" "}
                <span className="fw-semibold">Hotline: 1900 1234</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex vh-100 bg-light text-dark">
            {/* Sidebar (đảm bảo không bị co lại) */}
            <div className="flex-shrink-0">
              <Sidebar
                collapsed={sidebarCollapsed}
                activeMenu={activeMenu}
                onToggle={toggleSidebar}
                onSelectMenu={setActiveMenu}
                notificationCount={notificationCount}
                showUserDropdown={showUserDropdown}
                toggleUserDropdown={toggleUserDropdown}
              />
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
              {/* Header */}
              <HeaderAdmin
                title="Quản lý đơn hàng"
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                showUserDropdown={showUserDropdown}
                toggleUserDropdown={toggleUserDropdown}
              />

              {/* Main Section */}
              <main className="flex-grow-1 overflow-auto bg-light p-4">
                {/* Toolbar */}
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                  {/* Search Order */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Filters & Export */}
                  <div className="d-flex flex-wrap gap-3">
                    {/* Status Filter */}
                    <div className="dropdown">
                      <button
                        className="btn btn-outline-secondary dropdown-toggle"
                        onClick={toggleStatusDropdown}
                      >
                        {statusFilter === "all"
                          ? "Tất cả trạng thái"
                          : statusFilter}
                      </button>
                      {showStatusDropdown && (
                        <ul className="dropdown-menu show">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setStatusFilter("all");
                                setShowStatusDropdown(false);
                              }}
                            >
                              Tất cả trạng thái
                            </button>
                          </li>
                          {statuses.map((status, idx) => (
                            <li key={idx}>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setStatusFilter(status);
                                  setShowStatusDropdown(false);
                                }}
                              >
                                {status}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Date Range Filter */}
                    <div className="dropdown">
                      <button
                        className="btn btn-outline-secondary dropdown-toggle"
                        onClick={toggleDateRangeDropdown}
                      >
                        {dateRanges.find((r) => r.id === dateRangeFilter)
                          ?.name || "Tất cả thời gian"}
                      </button>
                      {showDateRangeDropdown && (
                        <ul className="dropdown-menu show">
                          {dateRanges.map((range) => (
                            <li key={range.id}>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setDateRangeFilter(range.id);
                                  setShowDateRangeDropdown(false);
                                }}
                              >
                                {range.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Export Excel Button */}
                    <button
                      className="btn text-dark"
                      style={{ backgroundColor: "#ede734" }}
                      onClick={exportToExcel}
                    >
                      <i className="fas fa-file-export me-2"></i> Xuất Excel
                    </button>
                  </div>
                </div>

                {/* Orders Table */}
                <div
                  className="card shadow rounded overflow-hidden w-100"
                  style={{ maxWidth: "none" }}
                >
                  {/* Header */}
                  <div className="card-header bg-white border-bottom px-4 py-3">
                    <h3 className="h5 mb-0">Danh sách đơn hàng</h3>
                  </div>
                  {/* Table container */}
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr className="border-bottom">
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                          >
                            Mã đơn hàng
                          </th>
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                          >
                            Khách hàng
                          </th>
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                          >
                            Ngày đặt
                          </th>
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap text-end"
                          >
                            Tổng tiền
                          </th>
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap text-center"
                          >
                            Trạng thái
                          </th>
                          <th
                            scope="col"
                            className="ps-4 pe-4 py-3 text-start text-uppercase small text-secondary align-middle text-nowrap"
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-bottom">
                            {/* Mã đơn hàng */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                              <div className="small fw-medium text-dark">
                                {order.orderCode}
                              </div>
                            </td>
                            {/* Khách hàng */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                              <div className="small fw-medium text-dark">
                                {order.userName}
                              </div>
                              <div className="small text-secondary">
                                {order.userPhoneNumber}
                              </div>
                            </td>
                            {/* Ngày đặt */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                              <div className="small text-secondary">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </div>
                            </td>
                            {/* Tổng tiền */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                              <div className="small text-secondary text-end">
                                {Math.round(order.totalAmount).toLocaleString(
                                  "vi-VN"
                                )}
                                ₫
                              </div>
                            </td>
                            {/* Trạng thái */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap  text-center">
                              <span
                                className={`badge bg-${
                                  statusBadgeColor[order.status] || "secondary"
                                } px-2 py-1 small`}
                              >
                                {order.status}
                              </span>
                            </td>
                            {/* Thao tác */}
                            <td className="ps-4 pe-4 py-3 align-middle text-nowrap">
                              <div className="d-flex align-items-center">
                                <button
                                  className="btn btn-link text-primary p-0 me-3"
                                  title="Xem chi tiết"
                                  onClick={() => {
                                    setShowModalOrder(true);
                                    handleViewOrderDT(order.orderCode);
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-link text-success p-0 me-3"
                                  title="Cập nhật trạng thái"
                                  onClick={() =>
                                    handleUpdateStatusClick(order.orderCode)
                                  }
                                >
                                  <i className="fas fa-sync-alt"></i>
                                </button>
                                {order.status === "GIAO_HANG_THANH_CONG" && (
                                  <button
                                    onClick={() => {
                                      handleViewOrder(order.orderCode);
                                      setTimeout(handlePrint, 100);
                                    }}
                                    className="btn btn-link text-secondary p-0 me-3"
                                    title="In hóa đơn"
                                  >
                                    <i className="fas fa-print"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer phân trang & thống kê */}
                  <style>{`
                        .pagination {
                            margin-top: 3rem; /* tương đương mt-12 */
                          }
                          
                          .pagination .page-item {
                            margin: 0 0.25rem;
                          }
                          
                          .pagination .page-link {
                            padding: 0.5rem 0.75rem;         /* tương đương px-3 py-2 */
                            border-radius: 0.5rem;           /* rounded-lg */
                            border: 1px solid #d1d5db;       /* border-gray-300 */
                            color: #6b7280;                  /* text-gray-500 */
                            white-space: nowrap;             /* nowrap */
                            transition: background-color .2s;
                          }
                          
                          .pagination .page-link:hover {
                            background-color: #f9fafb;       /* hover:bg-gray-50 */
                          }
                          
                          .pagination .page-item.active .page-link {
                            background-color: #ede734;       /* bg-[#ede734] */
                            color: #000;                     /* text-black */
                            font-weight: 500;                /* font-medium */
                            border-color: #ede734;
                          }
                          
                          .pagination .page-item.disabled .page-link {
                            color: #9ca3af;                  /* text-gray-400 */
                            pointer-events: none;
                            background: transparent;
                            border-color: #d1d5db;
                          }
                        `}</style>
                  <div className="mt-4 d-flex justify-content-end">
                    <nav aria-label="Page navigation">
                      <ul
                        className="pagination"
                        style={{ marginTop: 0, marginRight: 35 }}
                      >
                        {/* PREV */}
                        <li
                          className={`page-item ${
                            currentPage === 0 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 0}
                          >
                            <i className="fas fa-chevron-left" />
                          </button>
                        </li>

                        {/* PAGE NUMBERS */}
                        {Array.from({ length: totalPages }).map((_, index) => (
                          <li
                            key={index}
                            className={`page-item ${
                              currentPage === index ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(index)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}

                        {/* NEXT */}
                        <li
                          className={`page-item ${
                            currentPage === totalPages - 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                          >
                            <i className="fas fa-chevron-right" />
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </main>
            </div>

            {/* Update Status Modal */}
            {showUpdateStatusModal && (
              <>
                <div
                  className="modal fade show d-block"
                  tabIndex={-1}
                  role="dialog"
                  style={{
                    zIndex: 1055,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    role="document"
                  >
                    <div className="modal-content">
                      <div className="modal-header border-0">
                        <h5 className="modal-title text-primary">
                          Cập nhật trạng thái đơn hàng
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={cancelUpdateStatus}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Trạng thái mới</label>
                          <div className="position-relative">
                            <select
                              className="form-select"
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                            >
                              <option value="">-- Chọn trạng thái --</option>
                              {statuses.map((st, idx) => (
                                <option key={idx} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer border-0">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={cancelUpdateStatus}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            !newStatus
                              ? "btn-secondary disabled"
                              : "btn-primary"
                          }`}
                          onClick={confirmUpdateStatus}
                          disabled={!newStatus}
                        >
                          Cập nhật
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Backdrop */}
                <div
                  className="modal-backdrop fade show"
                  style={{ zIndex: 1050 }}
                ></div>
              </>
            )}

            {/* Toast Notification */}
            {showToast && (
              <div
                className="position-fixed bottom-0 end-0 p-3"
                style={{ zIndex: 2000 }}
              >
                <div
                  className={`toast show align-items-center text-white bg-${
                    toastType === "success" ? "success" : "danger"
                  } border-0`}
                  role="alert"
                >
                  <div className="d-flex">
                    <div className="toast-body">{toastMessage}</div>
                    <button
                      type="button"
                      className="btn-close btn-close-white me-2 m-auto"
                      onClick={() => setShowToast(false)}
                    ></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hiển thị modal ngoài dropdown */}
          {showModalOrder && (
            <OrderDetails
              orderDT={orderDT}
              onClose={() => setShowModalOrder(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default OrderManagement;
