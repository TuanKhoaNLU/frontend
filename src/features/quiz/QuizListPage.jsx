import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/client";
import "./QuizListPage.css";

const CATEGORY_CHIPS = [
  { label: "Art & Literature", tone: "chip--1" },
  { label: "Entertainment", tone: "chip--2" },
  { label: "Geography", tone: "chip--3" },
  { label: "History", tone: "chip--4" },
  { label: "Science & Nature", tone: "chip--5" },
  { label: "Sports", tone: "chip--6" },
  { label: "Trivia", tone: "chip--7" },
];

const CARD_TONES = ["card--a", "card--b", "card--c", "card--d"];

function QuizListPage({ isLoggedIn = false }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");

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
          </div>
        </div>
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
              Quiz room ID
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
      </section>

      <section className="quiz-categories" aria-label="Popular topics">
        <h3 className="quiz-categories-title">Explore topics</h3>
        <div className="quiz-chip-row">
          {CATEGORY_CHIPS.map((c) => (
            <span key={c.label} className={`quiz-chip ${c.tone}`}>
              {c.label}
            </span>
          ))}
        </div>
      </section>

      <section id="quiz-list" className="quiz-list-section" aria-labelledby="quiz-list-title">
        <div className="quiz-list-head">
          <h2 id="quiz-list-title" className="quiz-list-title">
            Available quizzes
          </h2>
        </div>

        {error && (
          <div className="quiz-alert quiz-alert--error" role="alert">
            {error}
          </div>
        )}

        {!error && quizzes.length === 0 && (
          <div className="quiz-empty">
            <p className="quiz-empty-title">No quizzes yet</p>
            <p className="quiz-empty-text">Start the API and refresh — sample quizzes will appear here.</p>
          </div>
        )}

        <ul className="quiz-list">
          {quizzes.map((quiz, index) => (
            <li
              className={`quiz-item ${CARD_TONES[index % CARD_TONES.length]}`}
              key={quiz.id}
            >
              <div className="quiz-item-top">
                <span className="quiz-item-icon" aria-hidden="true">
                  ?
                </span>
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
          ))}
        </ul>
      </section>
    </div>
  );
}

export default QuizListPage;
