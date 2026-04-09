import { Link, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import QuizListPage from "./features/quiz/QuizListPage";

function App() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>quiz_web</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Quizzes</Link>
        <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<QuizListPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;
