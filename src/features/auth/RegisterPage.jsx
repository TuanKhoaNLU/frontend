import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/client";
import "./LoginPage.css";
import "./RegisterPage.css";

function extractErrorMessage(err) {
  if (!err?.response) {
    return "Không kết nối được server. Hãy chạy backend (cổng 8080, ví dụ: mvn spring-boot:run trong thư mục backend) và thử lại.";
  }
  const data = err.response.data;
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (typeof data?.error === "string" && typeof data?.message === "string") {
    return data.message;
  }
  if (typeof data === "string") {
    return data;
  }
  return `Lỗi ${err.response.status}. Kiểm tra console backend và file application.yml (MySQL).`;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/register", {
        username: username.trim(),
        password
      });
      setSuccess("Đăng ký thành công. Chuyển đến trang đăng nhập…");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const status = err?.response?.status;
      const msg = extractErrorMessage(err);
      if (status === 409) {
        setError("Tên đăng nhập đã được sử dụng.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <section className="login-card">
        <p className="login-eyebrow">Tài khoản mới</p>
        <h2 className="login-title">Đăng ký</h2>
        <p className="login-sub">Tạo tài khoản để lưu tiến độ và tham gia phòng quiz.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Tên đăng nhập
            <input
              className="login-input"
              type="text"
              placeholder="3–50 ký tự"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
            />
          </label>
          <label className="login-label">
            Mật khẩu
            <input
              className="login-input"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              required
            />
          </label>
          <label className="login-label">
            Xác nhận mật khẩu
            <input
              className="login-input"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng ký…" : "Đăng ký"}
          </button>
        </form>
        {error && <p className="login-message error">{error}</p>}
        {success && <p className="login-message success">{success}</p>}
        <p className="register-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterPage;
