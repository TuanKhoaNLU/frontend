import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/client";
import "./QuizListPage.css";

const CARD_TONES = ["card--a", "card--b", "card--c", "card--d"];

// React SVG icons for categories
function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 9.8 20.2 8 18 8H17C16.4 8 16 7.6 16 7V6C16 3.8 14.2 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
      <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
      <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h14" />
      <path d="M5 22h14" />
      <path d="M19 2v4c0 3-2.5 5-5 5h-4C7.5 11 5 9 5 6V2" />
      <path d="M5 22v-4c0-3 2.5-5 5-5h4c2.5 0 5 2 5 5v4" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeDasharray="3 3" />
      <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(30 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-30 12 12)" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 0-6 6v3.58a6 6 0 0 0 6 6 6 6 0 0 0 6-6V8a6 6 0 0 0-6-6z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function AllIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

const CATEGORY_CHIPS = [
  { label: "All", tone: "chip--all", icon: <AllIcon /> },
  { label: "Art & Literature", tone: "chip--1", icon: <PaletteIcon /> },
  { label: "Entertainment", tone: "chip--2", icon: <FilmIcon /> },
  { label: "Geography", tone: "chip--3", icon: <GlobeIcon /> },
  { label: "History", tone: "chip--4", icon: <HourglassIcon /> },
  { label: "Science & Nature", tone: "chip--5", icon: <AtomIcon /> },
  { label: "Sports", tone: "chip--6", icon: <TrophyIcon /> },
  { label: "Trivia", tone: "chip--7", icon: <LightbulbIcon /> },
];

const CATEGORY_STYLES = {
  "Art & Literature": {
    gradient: "linear-gradient(135deg, #ec4899 0%, #ef4444 100%)",
    shadow: "rgba(239, 68, 68, 0.3)",
    icon: <PaletteIcon />
  },
  "Entertainment": {
    gradient: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
    shadow: "rgba(168, 85, 247, 0.3)",
    icon: <FilmIcon />
  },
  "Geography": {
    gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
    shadow: "rgba(10, 185, 129, 0.3)",
    icon: <GlobeIcon />
  },
  "History": {
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
    shadow: "rgba(249, 115, 22, 0.3)",
    icon: <HourglassIcon />
  },
  "Science & Nature": {
    gradient: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
    shadow: "rgba(34, 197, 94, 0.3)",
    icon: <AtomIcon />
  },
  "Sports": {
    gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
    shadow: "rgba(220, 38, 38, 0.3)",
    icon: <TrophyIcon />
  },
  "Trivia": {
    gradient: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
    shadow: "rgba(99, 102, 241, 0.3)",
    icon: <LightbulbIcon />
  }
};

const getQuizCategory = (title) => {
  if (!title) return "Trivia";
  const t = title.toLowerCase();
  if (t.includes("art") || t.includes("literature") || t.includes("văn học") || t.includes("nghệ thuật")) return "Art & Literature";
  if (t.includes("entertainment") || t.includes("giải trí") || t.includes("phim") || t.includes("nhạc")) return "Entertainment";
  if (t.includes("geography") || t.includes("địa lý") || t.includes("bản đồ")) return "Geography";
  if (t.includes("history") || t.includes("lịch sử")) return "History";
  if (t.includes("science") || t.includes("nature") || t.includes("khoa học") || t.includes("tự nhiên")) return "Science & Nature";
  if (t.includes("sport") || t.includes("thể thao") || t.includes("bóng")) return "Sports";
  return "Trivia";
};

function QuizListPage({ isLoggedIn = false }) {
  const navigate = useNavigate();
  
  // Quiz states
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");

  // AI Panel control state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiTimeLimit, setAiTimeLimit] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await apiClient.get("/quizzes");
        setQuizzes(response.data);
      } catch (err) {
        setError("Cannot load quizzes. Start the backend first.");
      }
    };

    fetchQuizzes();
  }, []);

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    setAiError("");
    setAiSuccess("");
    setAiLoading(true);

    try {
      const payload = {
        quizTitle: aiTitle.trim(),
        numberOfQuestions: aiCount,
        timeLimitSeconds: aiTimeLimit,
      };

      const response = await apiClient.post("/quizzes/generate-ai", payload);
      setAiSuccess(`Tạo thành công bộ câu hỏi AI: #${response.data.id}`);
      setAiTitle("");
      setAiCount(5);
      setAiTimeLimit(5);

      // Load lại danh sách quiz
      const refreshResponse = await apiClient.get("/quizzes");
      setQuizzes(refreshResponse.data);

      // Tự động đóng panel sau khi hoàn thành thành công
      setTimeout(() => {
        setShowAiPanel(false);
        setAiSuccess("");
      }, 3000);

      // Cuộn xuống danh sách quiz sau khi tạo xong để hiển thị kết quả
      setTimeout(() => {
        const listEl = document.getElementById("quiz-list");
        if (listEl) {
          listEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || err?.response?.data || "Sinh câu hỏi tự động thất bại. Hãy chắc chắn Server Backend đang hoạt động.";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (selectedCategory === "All") return true;
    return getQuizCategory(quiz.title) === selectedCategory;
  });

  return (
    <div className="quiz-page">
      <section className="quiz-hero" aria-labelledby="quiz-hero-title">
        <div className="quiz-hero-copy">
          <p className="quiz-hero-eyebrow">Join the fun</p>
          <h2 id="quiz-hero-title" className="quiz-hero-title">
            Play quizzes, challenge yourself, learn something new
          </h2>
          <p className="quiz-hero-desc">
            Pick a quiz below and start in one tap — same spirit as popular quiz hubs, tailored for your project.
          </p>
          <div className="quiz-hero-actions">
            <a className="quiz-btn quiz-btn--primary" href="#quiz-list">
              Start playing
            </a>
            <Link className="quiz-btn quiz-btn--ghost" to="/create-quiz">
              Create quiz
            </Link>
            <button
              type="button"
              className={`quiz-btn quiz-btn--ai ${showAiPanel ? "active" : ""}`}
              onClick={() => {
                setShowAiPanel((prev) => !prev);
                setAiError("");
                setAiSuccess("");
                if (!showAiPanel) {
                  setTimeout(() => {
                    const inputEl = document.getElementById("ai-title");
                    if (inputEl) inputEl.focus();
                  }, 150);
                }
              }}
            >
              ✨ AI Creator
            </button>
          </div>
        </div>

        {/* Cột bên phải: Trả về nguyên bản chỉ nhập PIN phòng */}
        <div className="quiz-hero-card">
          <form
            className="quiz-room-form"
            onSubmit={(e) => {
              e.preventDefault();
              const pin = roomId.trim();
              if (!pin) return;
              navigate(`/live/join?pin=${encodeURIComponent(pin)}`);
            }}
          >
            <label className="quiz-room-label" htmlFor="quiz-room-id">
              📡 Quiz room ID
            </label>
            <input
              id="quiz-room-id"
              className="quiz-room-input"
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Enter room code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.trimStart())}
            />
            <button type="submit" className="quiz-room-submit" disabled={!roomId.trim()}>
              Join room
            </button>
          </form>
        </div>

        {/* Panel xổ xuống toàn màn hình chiều ngang nằm dưới Hero */}
        {showAiPanel && (
          <div className="quiz-hero-ai-panel">
            <button
              type="button"
              className="ai-panel-close-btn"
              onClick={() => setShowAiPanel(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="ai-panel-title">✨ AI Quiz Creator</h3>
            <p className="ai-panel-desc">Tạo bộ câu hỏi nhanh chóng bằng trí tuệ nhân tạo chỉ với tên chủ đề.</p>

            {!isLoggedIn ? (
              <div className="quiz-ai-locked-panel">
                <p className="ai-lock-text">Bạn cần đăng nhập tài khoản để sử dụng tính năng tạo Quiz tự động bằng AI.</p>
                <Link className="quiz-btn quiz-btn--primary" to="/login">
                  Đi tới Đăng nhập
                </Link>
              </div>
            ) : (
              <form className="ai-panel-form-layout" onSubmit={handleAiGenerate}>
                <div className="ai-form-col">
                  <label className="quiz-room-label" htmlFor="ai-title">
                    Chủ đề Quiz
                  </label>
                  <input
                    id="ai-title"
                    className="quiz-room-input"
                    type="text"
                    placeholder="Ví dụ: Lập trình Java, Lịch sử Việt Nam..."
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    disabled={aiLoading}
                    required
                  />
                </div>

                <div className="ai-form-col">
                  <div className="ai-slider-row">
                    <label className="quiz-room-label" htmlFor="ai-count">
                      Số câu hỏi: {aiCount}
                    </label>
                    <input
                      id="ai-count"
                      type="range"
                      min="1"
                      max="20"
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      disabled={aiLoading}
                      className="ai-slider"
                    />
                  </div>

                  <div className="ai-slider-row" style={{ marginTop: "12px" }}>
                    <label className="quiz-room-label" htmlFor="ai-time-limit">
                      Thời gian trả lời: {aiTimeLimit} giây
                    </label>
                    <input
                      id="ai-time-limit"
                      type="range"
                      min="1"
                      max="10"
                      value={aiTimeLimit}
                      onChange={(e) => setAiTimeLimit(Number(e.target.value))}
                      disabled={aiLoading}
                      className="ai-slider"
                    />
                  </div>
                </div>

                <div className="ai-form-col ai-form-col--submit">
                  {aiError && <div className="ai-alert ai-alert--error">{aiError}</div>}
                  {aiSuccess && <div className="ai-alert ai-alert--success">{aiSuccess}</div>}
                  
                  <button
                    type="submit"
                    className="quiz-ai-submit"
                    disabled={aiLoading || !aiTitle.trim()}
                  >
                    {aiLoading ? (
                      <span className="spinner-loader"></span>
                    ) : (
                      "✨ Generate Quiz"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="quiz-categories" aria-label="Popular topics">
        <h3 className="quiz-categories-title">Explore topics</h3>
        <div className="quiz-chip-row">
          {CATEGORY_CHIPS.map((c) => {
            const isActive = selectedCategory === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setSelectedCategory(c.label)}
                className={`quiz-chip ${c.tone} ${isActive ? "active" : ""}`}
              >
                <span className="quiz-chip-icon" aria-hidden="true">
                  {c.icon}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <section id="quiz-list" className="quiz-list-section" aria-labelledby="quiz-list-title">
        <div className="quiz-list-head">
          <h2 id="quiz-list-title" className="quiz-list-title">
            {selectedCategory === "All" ? "Available quizzes" : `${selectedCategory} Quizzes`}
          </h2>
        </div>

        {error && (
          <div className="quiz-alert quiz-alert--error" role="alert">
            {error}
          </div>
        )}

        {!error && filteredQuizzes.length === 0 && (
          <div className="quiz-empty">
            <p className="quiz-empty-title">Chưa có bộ câu hỏi nào</p>
            <p className="quiz-empty-text">
              {selectedCategory === "All"
                ? "Hãy sử dụng tính năng ✨ AI Creator ở trên để tạo bộ câu hỏi tự động ngay!"
                : `Không có bộ câu hỏi nào thuộc chủ đề "${selectedCategory}".`}
            </p>
          </div>
        )}

        <ul className="quiz-list">
          {filteredQuizzes.map((quiz, index) => {
            const categoryName = getQuizCategory(quiz.title);
            const catStyle = CATEGORY_STYLES[categoryName] || CATEGORY_STYLES["Trivia"];
            
            return (
              <li
                className={`quiz-item ${CARD_TONES[index % CARD_TONES.length]}`}
                key={quiz.id}
              >
                <div className="quiz-item-top">
                  <div
                    className="quiz-item-icon"
                    style={{
                      background: catStyle.gradient,
                      boxShadow: `0 4px 12px ${catStyle.shadow}`,
                      color: "#fff",
                    }}
                    aria-hidden="true"
                  >
                    {catStyle.icon}
                  </div>
                  <span className={`quiz-badge ${quiz.published ? "" : "draft"}`}>
                    {quiz.published ? "Live" : "Draft"}
                  </span>
                </div>
                <h3 className="quiz-item-title">{quiz.title}</h3>
                <p className="quiz-item-meta">Quiz #{quiz.id}</p>
                <div className="quiz-item-actions">
                  <Link className="quiz-item-play" to={`/play/${quiz.id}`}>
                    Play now
                  </Link>
                  {isLoggedIn && (
                    <Link className="quiz-item-play quiz-item-play--secondary" to={`/live/host/${quiz.id}`}>
                      Tạo phòng live
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default QuizListPage;
