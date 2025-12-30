import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";

export default function VNPayReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const data = Object.fromEntries([...params]);

    apiFetch("/api/payment/vnpay-confirm", {
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(result => {
        if (result.success) {
          navigate(`/profile?orderCode=${result.orderCode}`);
        } else {
          navigate(`/profile?payment=fail`);
        }
      })
      .catch(() => {
        navigate("/profile?payment=error");
      });

  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3>Đang xử lý kết quả thanh toán...</h3>
    </div>
  );
}
