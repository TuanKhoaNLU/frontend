import { Link, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import CreateQuizPage from "./features/quiz/CreateQuizPage";
import EditQuizPage from "./features/quiz/EditQuizPage";
import MyQuizzesPage from "./features/quiz/MyQuizzesPage";
import PlayQuizPage from "./features/quiz/PlayQuizPage";
import QuizListPage from "./features/quiz/QuizListPage";
import { clearAccessToken, getAccessToken, onAccessTokenChanged } from "./features/auth/tokenStorage";
import apiClient from "./api/client";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [token, setToken] = useState(getAccessToken());

  useEffect(() => onAccessTokenChanged(() => setToken(getAccessToken())), []);

  useEffect(() => {
    if (!token) return;
    const verifySession = async () => {
      try {
        await apiClient.get("/quizzes/mine");
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          clearAccessToken();
          setToken(null);
        }
      }
    };
    verifySession();
  }, [token]);

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
            {token && (
              <>
                <Link className="app-link" to="/create-quiz">
                  Create Quiz
                </Link>
                <Link className="app-link" to="/my-quizzes">
                  My Quizzes
                </Link>
              </>
            )}
            {!token ? (
              <>
                <Link className="app-link" to="/register">
                  Đăng ký
                </Link>
                <Link className="app-link" to="/login">
                  Sign in
                </Link>
              </>
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
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create-quiz" element={<CreateQuizPage isLoggedIn={Boolean(token)} />} />
          <Route path="/my-quizzes" element={<MyQuizzesPage isLoggedIn={Boolean(token)} />} />
          <Route path="/my-quizzes/:quizId/edit" element={<EditQuizPage isLoggedIn={Boolean(token)} />} />
          <Route path="/play/:quizId" element={<PlayQuizPage />} />
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
