// src/pages/payment/PaymentReturn.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { reloadMe } = useAuth();

  const orderCode = params.get("orderCode");
  const status = params.get("status"); 
  // SUCCESS | FAILED | CANCELLED

  useEffect(() => {
    const run = async () => {
      try {
        // 🔐 1️⃣ KHÔI PHỤC ĐĂNG NHẬP (QUAN TRỌNG NHẤT)
        await reloadMe();

        // ✅ 2️⃣ SAU KHI ĐÃ LOGIN → mới được sang profile
        navigate("/profile", {
          replace: true,
          state: {
            paymentStatus: status,
            orderCode,
          },
        });
      } catch (e) {
        // fallback nếu refresh fail
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [reloadMe, navigate, status, orderCode]);

  // ⛔ Không render gì
  return null;
}
