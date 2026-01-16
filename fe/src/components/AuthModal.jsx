import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import GoogleLoginButton from "./GoogleLoginButton";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom'

function AuthModal({ open, onClose, initialTab = "login" }) {
  const { login, register } = useAuth();

  // ----------------- State -----------------
  const [tab, setTab] = useState(initialTab); // 'login' | 'register' | 'forgot' | 'checking'
  const [loading, setLoading] = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // register
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // forgot
  const [forgotEmail, setForgotEmail] = useState("");

  const [errors, setErrors] = useState({});
  const resetErrors = () => setErrors({});

  const navigate = useNavigate()

  // ----------------- Effects -----------------
  useEffect(() => {
    if (open) {
      resetErrors();
      setTab(initialTab);
    }
  }, [open, initialTab]);

  // ----------------- Memo (đặt TRƯỚC return) -----------------
  const styles = useMemo(
    () => ({
      overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      modal: {
        position: "relative",
        background: "#fff",
        padding: "30px",
        borderRadius: 8,
        width: 400,
        maxHeight: 600,
        zIndex: 1001,
        boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
      },
      closeBtn: {
        position: "absolute",
        top: 10,
        right: 15,
        background: "none",
        border: "none",
        fontSize: 32,
        cursor: "pointer",
        color: "#999",
        lineHeight: 1,
      },
      sliderWrapper: { overflow: "hidden", width: "100%", marginTop: 20 },
      slider: {
        display: "flex",
        width: "200%",
        transition: "transform 0.4s ease",
      },
      panel: { width: "50%", boxSizing: "border-box" },
      input: {
        display: "block",
        width: "100%",
        padding: 10,
        fontSize: 16,
        borderRadius: 6,
        border: "1px solid #ccc",
        marginTop: 15,
        background: "#fffff1",
        color: "#000",
      },
      passwordWrapper: {
        position: "relative",
        width: "100%",
        marginTop: 15,
        color: "#000",
      },
      inputWithIcon: { paddingRight: 40 },
      icon: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        fontSize: 18,
        color: "#666",
      },
      loginBtn: {
        width: "100%",
        padding: 10,
        fontSize: 16,
        background: "#000",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        marginTop: 15,
        marginBottom: 15,
        cursor: "pointer",
      },
      linkBtn: {
        background: "none",
        border: "none",
        color: "#007bff",
        textDecoration: "underline",
        cursor: "pointer",
        padding: 0,
        fontSize: "1em",
      },
      errorText: {
        color: "red",
        fontSize: "0.9em",
        marginTop: 5,
        marginBottom: 0,
      },
    }),
    []
  );

  const sliderTransform = useMemo(
    () => (tab === "register" ? "translateX(-50%)" : "translateX(0)"),
    [tab]
  );

  // ----------------- Handlers -----------------
  async function handleLogin() {
    resetErrors();
    setLoading(true);
    try {
      if (!loginEmail) {
        setErrors((e) => ({ ...e, loginEmail: "Email không được để trống" }));
        return;
      }
      if (!loginPassword) {
        setErrors((e) => ({
          ...e,
          loginPassword: "Mật khẩu không được để trống",
        }));
        return;
      }
      const user = await login(loginEmail, loginPassword);
      console.log("User sau khi login:", user); 
      if (user?.role === "ROLE_ADMIN"||user?.role === "ROLE_SUPER_ADMIN") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
      onClose?.();
    } catch (e) {
      toast.error(e.message);
      setErrors((e2) => ({ ...e2, loginForm: e.message }));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    resetErrors();
    setLoading(true);
    try {
      if (!registerEmail) {
        setErrors((e) => ({
          ...e,
          registerEmail: "Email không được để trống",
        }));
        return;
      }
      if (!registerPassword) {
        setErrors((e) => ({
          ...e,
          registerPassword: "Mật khẩu không được để trống",
        }));
        return;
      }
      if (registerPassword !== confirmPassword) {
        setErrors((e) => ({
          ...e,
          confirmPassword: "Mật khẩu nhập lại không khớp",
        }));
        return;
      }
      await register(registerEmail, registerPassword);
      setTab("checking");
    } catch (e) {
      toast.error(e.message);
      setErrors((e2) => ({ ...e2, registerForm: e.message }));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    resetErrors();
    setLoading(true);
    try {
      if (!forgotEmail) {
        setErrors((e) => ({ ...e, forgotEmail: "Email không được để trống" }));
        return;
      }
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        }
      );
      if (!resp.ok) throw new Error("Gửi email thất bại");
      toast.success("Đã gửi email đặt lại mật khẩu");
      setTab("checking");
    } catch (e) {
      toast.error(e.message);
      setErrors((e2) => ({ ...e2, forgotForm: e.message }));
    } finally {
      setLoading(false);
    }
  }

  // ----------------- Return sớm sau tất cả hooks -----------------
  if (!open) return null;

  const isRegister = tab === "register";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          ×
        </button>

        <div style={{ textAlign: "center" }}>
          <img
            src="/images/logoVuong.png"
            alt="150"
          />
        </div>

        {/* Màn loading/nhắc xác thực */}
        {tab === "checking" && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ textAlign: "center" }}>Kiểm tra email của bạn</h4>
            <div className="spinner" />
            <p>
              Chúng tôi đã gửi email xác thực hoặc đặt lại mật khẩu. Hãy mở hộp
              thư và làm theo hướng dẫn.
            </p>
            <p style={{ textAlign: "center" }}>
              <button
                style={styles.linkBtn}
                onClick={() => setTab("login")}
                disabled={loading}
              >
                Quay lại đăng nhập
              </button>
            </p>
          </div>
        )}

        {/* Quên mật khẩu */}
        {tab === "forgot" && (
          <div style={{ marginTop: 10 }}>
            <h4>Quên mật khẩu</h4>
            {errors.forgotForm && (
              <p style={styles.errorText}>{errors.forgotForm}</p>
            )}
            <input
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            {errors.forgotEmail && (
              <p style={styles.errorText}>{errors.forgotEmail}</p>
            )}
            <button
              onClick={handleForgot}
              style={styles.loginBtn}
              disabled={loading}
            >
              {loading ? "Đang xử lý…" : "Gửi email"}
            </button>
            <p style={{ marginTop: 10, textAlign: "center" }}>
              <button
                onClick={() => setTab("login")}
                style={styles.linkBtn}
                disabled={loading}
              >
                Quay lại đăng nhập
              </button>
            </p>
          </div>
        )}

        {/* Login/Register slider */}
        {(tab === "login" || tab === "register") && (
          <div style={styles.sliderWrapper}>
            <div style={{ ...styles.slider, transform: sliderTransform }}>
              {/* ===== ĐĂNG NHẬP ===== */}
              <div style={{ ...styles.panel, padding: "0 5px" }}>
                <h4>Đăng nhập</h4>
                {errors.loginForm && (
                  <p style={styles.errorText}>{errors.loginForm}</p>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={styles.input}
                  autoComplete="off"
                  disabled={loading}
                />
                {errors.loginEmail && (
                  <p style={styles.errorText}>{errors.loginEmail}</p>
                )}

                <div style={styles.passwordWrapper}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ ...styles.input, ...styles.inputWithIcon }}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowLoginPassword((s) => !s)}
                    style={styles.icon}
                  >
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.loginPassword && (
                  <p style={styles.errorText}>{errors.loginPassword}</p>
                )}

                <button
                  onClick={handleLogin}
                  style={styles.loginBtn}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý…" : "Đăng nhập"}
                </button>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setTab("forgot")}
                    style={styles.linkBtn}
                    disabled={loading}
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <GoogleLoginButton onSuccess={onClose}/>

                <p style={{ marginTop: 20, textAlign: "center" }}>
                  Bạn chưa có tài khoản?{" "}
                  <button
                    onClick={() => {
                      resetErrors();
                      setTab("register");
                    }}
                    style={styles.linkBtn}
                    disabled={loading}
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>

              {/* ===== ĐĂNG KÝ ===== */}
              <div style={{ ...styles.panel, padding: "0 5px" }}>
                <h4>Đăng ký</h4>
                {errors.registerForm && (
                  <p style={styles.errorText}>{errors.registerForm}</p>
                )}

                <input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  style={styles.input}
                  autoComplete="off"
                  disabled={loading}
                />
                {errors.registerEmail && (
                  <p style={styles.errorText}>{errors.registerEmail}</p>
                )}

                <div style={styles.passwordWrapper}>
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    style={{ ...styles.input, ...styles.inputWithIcon }}
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowRegisterPassword((s) => !s)}
                    style={styles.icon}
                  >
                    {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.registerPassword && (
                  <p style={styles.errorText}>{errors.registerPassword}</p>
                )}

                <div style={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ ...styles.input, ...styles.inputWithIcon }}
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    style={styles.icon}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p style={styles.errorText}>{errors.confirmPassword}</p>
                )}

                <button
                  onClick={handleRegister}
                  style={styles.loginBtn}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý…" : "Đăng ký"}
                </button>

                <p style={{ marginTop: 20, textAlign: "center" }}>
                  Bạn đã có tài khoản?{" "}
                  <button
                    onClick={() => {
                      resetErrors();
                      setTab("login");
                    }}
                    style={styles.linkBtn}
                    disabled={loading}
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
