import { Link, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import QuizListPage from "./features/quiz/QuizListPage";
import { clearAccessToken, getAccessToken, onAccessTokenChanged } from "./features/auth/tokenStorage";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [token, setToken] = useState(getAccessToken());

  useEffect(() => onAccessTokenChanged(() => setToken(getAccessToken())), []);

  const handleLogout = () => {
    clearAccessToken();
    setToken(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-brand">
            <span className="app-logo" aria-hidden="true">
              Q
            </span>
            <div className="app-brand-text">
              <h1 className="app-title">quiz_web</h1>
              <p className="app-tagline">Play &amp; learn — free &amp; fun</p>
            </div>
          </Link>
          <nav className="app-nav" aria-label="Main">
            <Link className="app-link app-link--primary" to="/">
              Quizzes
            </Link>
            {!token ? (
              <Link className="app-link" to="/login">
                Sign in
              </Link>
            ) : (
              <>
                <span className="app-status">Logged in</span>
                <button className="app-logout" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<QuizListPage />} />
          <Route path="/login" element={<LoginPage isLoggedIn={Boolean(token)} onLogout={handleLogout} />} />
        </Routes>
      </main>

      <footer className="app-footer">
        Inspired by the playful quiz experience at{" "}
        <a href="https://quiz.com/" target="_blank" rel="noopener noreferrer">
          Quiz.com
        </a>
        .
      </footer>
    </div>
  );
}

export default App;
