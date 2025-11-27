// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <>
      <footer
        className="text-white pt-5 pb-4"
        style={{ backgroundColor: '#000001' }}
      >
        <div className="container px-4">
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-5">
            {/* Thông tin công ty */}
            <div>
              <h5 className="text-uppercase fw-bold mb-4">Paraline Computer</h5>
              <p className="text-secondary mb-4">
                Hệ thống bán lẻ laptop, PC lắp ráp, linh kiện và phụ kiện máy
                tính chính hãng dành cho học tập, văn phòng và gaming.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="text-secondary hover-light">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-secondary hover-light">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-secondary hover-light">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-secondary hover-light">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>

              <img
                src="/images/logoBoCongThuong.webp"
                alt="Bộ công thương"
                style={{ width: '240px', marginTop: '20px' }}
                className="card-img-top"
              />
            </div>

            {/* Liên kết nhanh */}
            <div>
              <h5 className="text-uppercase fw-bold mb-4">Liên kết nhanh</h5>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <a
                    href="/"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Trang chủ
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/products?type=laptop"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Laptop
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/products?type=pc"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    PC lắp ráp
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/products?type=accessory"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Linh kiện & phụ kiện
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/about"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Giới thiệu
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/contact"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>

            {/* Dịch vụ khách hàng */}
            <div>
              <h5 className="text-uppercase fw-bold mb-4">
                Dịch vụ khách hàng
              </h5>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <a
                    href="/account"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Tài khoản của tôi
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/orders/track"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Tra cứu đơn hàng
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/policy/warranty"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Chính sách bảo hành
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/policy/return"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Đổi trả & Hoàn tiền
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/policy/shipping"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Chính sách giao hàng
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="/guide/payment"
                    className="text-secondary text-decoration-none hover-light"
                  >
                    Hướng dẫn thanh toán
                  </a>
                </li>
              </ul>
            </div>

            {/* Thông tin liên hệ */}
            <div>
              <h5 className="text-uppercase fw-bold mb-4">Liên hệ</h5>
              <ul className="list-unstyled text-secondary">
                <li className="mb-3 d-flex">
                  <i className="fas fa-map-marker-alt me-3 mt-1"></i>
                  <span>
                    Số 123, Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội, Việt Nam
                  </span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="fas fa-phone-alt me-3 mt-1"></i>
                  <span>1900 123 456</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="fas fa-envelope me-3 mt-1"></i>
                  <span>support@paralinecomputer.vn</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="fas fa-clock me-3 mt-1"></i>
                  <span>Thứ 2 - Chủ nhật: 8:00 - 21:00</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Thanh dưới cùng */}
          <div className="border-top border-secondary pt-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="text-secondary mb-3 mb-md-0">
              © 2025 Paraline Computer. Bảo lưu mọi quyền.
            </p>
            <div className="d-flex align-items-center gap-3">
              <span className="text-secondary">Phương thức thanh toán:</span>
              <i className="fab fa-cc-visa text-light fs-5"></i>
              <i className="fab fa-cc-mastercard text-light fs-5"></i>
              <i className="fab fa-cc-amex text-light fs-5"></i>
              <i className="fab fa-cc-paypal text-light fs-5"></i>
            </div>
          </div>
        </div>

        {/* Hiệu ứng hover */}
        <style>{`
          .hover-light:hover {
            color: white !important;
            transition: color 0.3s ease;
          }
        `}</style>
      </footer>
    </>
  );
};

export default Footer;
