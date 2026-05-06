import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/client";
import { setAccessToken } from "./tokenStorage";
import "./LoginPage.css";

function LoginPage({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", { username, password });
      const { accessToken } = response.data;
      setAccessToken(accessToken);
      setSuccess("Login successful. JWT saved.");
      setPassword("");
      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check username/password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="login-wrap">
        <section className="login-card">
          <p className="login-eyebrow">Account</p>
          <h2 className="login-title">You are signed in</h2>
          <p className="login-sub">Sign out first if you need to use another account.</p>
          <p className="login-message error login-message--tight">
            You cannot sign in again until you log out.
          </p>
          <button className="login-button login-button--outline" type="button" onClick={onLogout}>
            Logout
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <section className="login-card">
        <p className="login-eyebrow">Welcome back</p>
        <h2 className="login-title">Sign in</h2>
        <p className="login-sub">Enter your credentials to get a secure session token.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Username
            <input
              className="login-input"
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && <p className="login-message error">{error}</p>}
        {success && <p className="login-message success">{success}</p>}
        <p className="login-register-row">
          Chưa có tài khoản?{" "}
          <Link className="login-register-link" to="/register">
            Đăng ký
          </Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
