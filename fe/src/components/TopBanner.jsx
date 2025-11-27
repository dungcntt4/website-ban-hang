import React, { useState, useEffect } from "react";

const messages = [
  "GIAO HÀNG MIỄN PHÍ",
  "ĐỔI HÀNG MIỄN PHÍ TRONG 30 NGÀY",
  "TRẢ HÀNG DỄ DÀNG",
];

export default function TopBanner() {
  const [index, setIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Banner */}
      <div
        className="bg-dark text-light text-center py-2"
        style={{ cursor: "pointer" }}
        onClick={() => setShowModal(true)}
      >
        <strong style={{ fontSize: "12px" }}>{messages[index]}  <i class="fa-solid fa-chevron-down"></i></strong>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1050,
            display: "flex",
            justifyContent: "center",
            alignItems: "start",
            paddingTop: "0",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0",
              padding: "5rem",
              width: "100vw",
              maxWidth: "100vw",
              margin: "0",
              height: "400px",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              className="btn-close"
              style={{
                position: "absolute",
                top: "2rem",
                right: "2rem",
                zIndex: 1060,
                fontSize: "2rem",
                boxShadow: "none",
              }}
              onClick={() => setShowModal(false)}
            ></button>

            <div className="row mt-3">
              <div className="col-md-6">
                <h5><b>GIAO HÀNG MIỄN PHÍ</b></h5>
                <p>
                  Đăng ký thành viên để hưởng dịch vụ giao hàng miễn phí!
                  Hoặc bạn chỉ được nhận ưu đãi miễn phí giao hàng với hóa đơn có trị giá ít nhất 300.000 đồng
                </p>
                <a href="#" className="fw-bold text-decoration-underline text-dark">THAM GIA NGAY</a>
              </div>
              <div className="col-md-6">
                <h5><b>TRẢ HÀNG DỄ DÀNG</b></h5>
                <p>
                  Nếu bạn không hài lòng với đơn hàng của mình, bạn có thể được hoàn lại tiền.
                  Vui lòng xem Chính Sách Trả Hàng của chúng tôi để biết thêm chi tiết.
                </p>
                <a href="#" className="fw-bold text-decoration-underline text-dark">TRẢ HÀNG DỄ DÀNG</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
