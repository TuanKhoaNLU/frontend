import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/client";
import { setAccessToken } from "./tokenStorage";
import { auth, googleProvider, signInWithPopup } from "./firebaseConfig";
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const response = await apiClient.post("/auth/google", { token: idToken });
      
      const { accessToken } = response.data;
      setAccessToken(accessToken);
      setSuccess("Google login successful. JWT saved.");
      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Google login failed.");
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
        
        <div className="login-divider">
          <span>Or</span>
        </div>

        <button 
          className="login-button login-button--google" 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" className="google-icon" />
          Sign in with Google
        </button>

        {error && <p className="login-message error">{error}</p>}
        {success && <p className="login-message success">{success}</p>}
        <p className="login-register-row">
          Don't have an account?{" "}
          <Link className="login-register-link" to="/register">
            Register
          </Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
