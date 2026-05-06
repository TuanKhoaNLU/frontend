import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../api/client";

function PlayQuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [countdown, setCountdown] = useState(null);
  const [slideTimerStartedAt, setSlideTimerStartedAt] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameConfirmed, setNicknameConfirmed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/attempts/quiz/${quizId}`);
        setQuiz(response.data);
        setStartedAt(Date.now());
        setSubmitted(false);
        setNicknameConfirmed(false);
      } catch (err) {
        setError(err?.response?.data?.message || "Không tải được quiz.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  const slide = useMemo(() => (quiz?.slides ? quiz.slides[index] : null), [quiz, index]);

  useEffect(() => {
    if (!slide || quiz?.mode !== "TIME") {
      setCountdown(null);
      setSlideTimerStartedAt(null);
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    let timeoutId;
    const revealMs = slide.revealDurationMs || 0;
    timeoutId = setTimeout(() => {
      const timerStart = Date.now();
      setSlideTimerStartedAt(timerStart);
      const endAt = timerStart + (slide.timeLimitSeconds || 10) * 1000;
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setCountdown(left);
        if (left <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 250);
    }, revealMs);
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [slide, quiz?.mode]);

  const setAnswer = (patch) => {
    if (!slide) return;
    const elapsedMs =
      quiz?.mode === "TIME"
        ? Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()))
        : Math.max(0, Date.now() - startedAt);
    setAnswers((prev) => ({
      ...prev,
      [slide.slideId]: {
        slideId: slide.slideId,
        elapsedMs,
        ...prev[slide.slideId],
        ...patch
      }
    }));
  };

  const nextSlide = async () => {
    if (!quiz) return;
    if (quiz.mode === "TIME" && nicknameConfirmed) {
      await previewScore();
    }
    setIndex((prev) => Math.min(prev + 1, quiz.slides.length - 1));
  };

  const prevSlide = () => setIndex((prev) => Math.max(prev - 1, 0));

  const submitAttempt = async () => {
    if (submitted) {
      setError("Bạn đã nộp bài rồi, không thể nộp lại.");
      return;
    }
    if (!nicknameConfirmed) {
      setError("Vui lòng nhập nickname trước khi nộp bài.");
      return;
    }
    try {
      const response = await apiClient.post("/attempts/submit", {
        nickname,
        quizId: Number(quizId),
        totalDurationMs: Date.now() - startedAt,
        answers: Object.values(answers)
      });
      setLeaderboard(response.data.leaderboard || []);
      setSubmitted(true);
      alert(`Điểm: ${response.data.score} | Đúng: ${response.data.correctCount}/${response.data.totalQuestions}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Nộp bài thất bại.");
    }
  };

  const previewScore = async () => {
    try {
      const response = await apiClient.post("/attempts/preview", {
        nickname,
        quizId: Number(quizId),
        totalDurationMs: Date.now() - startedAt,
        answers: Object.values(answers)
      });
      setLeaderboard(response.data.leaderboard || []);
    } catch {
      // ignore preview errors in flow
    }
  };

  if (loading) return <p>Đang tải quiz...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!quiz || !slide) return <p>Quiz không có dữ liệu.</p>;

  if (!nicknameConfirmed) {
    return (
      <section className="create-quiz">
        <div className="create-quiz-head">
          <h2 className="create-quiz-title">{quiz.title}</h2>
          <p className="create-quiz-subtitle">Nhập nickname để bắt đầu làm quiz và ghi nhận kết quả.</p>
        </div>
        <div className="slide-card">
          <label className="create-quiz-label">
            Nickname
            <input
              className="create-quiz-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ví dụ: player01"
              minLength={2}
              maxLength={30}
            />
          </label>
          <div className="my-quiz-actions">
            <button
              onClick={() => {
                const normalized = nickname.trim();
                if (normalized.length < 2 || normalized.length > 30) {
                  setError("Nickname phải từ 2 đến 30 ký tự.");
                  return;
                }
                setNickname(normalized);
                setNicknameConfirmed(true);
                setError("");
                setStartedAt(Date.now());
              }}
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </section>
    );
  }

  const current = answers[slide.slideId] || {};

  return (
    <section className="create-quiz">
      <div className="create-quiz-head">
        <h2 className="create-quiz-title">{quiz.title}</h2>
        <p className="create-quiz-subtitle">
          Mode: {quiz.mode} • Câu {index + 1}/{quiz.slides.length}
          {` • Nickname: ${nickname}`}
          {quiz.mode === "NORMAL" && quiz.totalTimeLimitSeconds ? ` • Tổng thời gian: ${quiz.totalTimeLimitSeconds}s` : ""}
          {quiz.mode === "TIME" && typeof countdown === "number" ? ` • Còn lại: ${countdown}s` : ""}
        </p>
      </div>

      <article className="slide-card">
        <h3>{slide.question}</h3>
        {slide.imageUrl && <img src={slide.imageUrl} alt="" style={{ maxWidth: "100%", borderRadius: 10 }} />}

        {(slide.type === "SINGLE_CHOICE" || slide.type === "MULTI_CHOICE") && (
          <div className="slide-options">
            {(slide.options || []).map((option, idx) => {
              const selected = current.selectedOptionIndexes || [];
              return (
                <label key={idx} className="slide-option-row">
                  <input
                    type={slide.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                    checked={selected.includes(idx)}
                    onChange={(e) => {
                      if (slide.type === "SINGLE_CHOICE") {
                        setAnswer({ selectedOptionIndexes: [idx] });
                      } else {
                        const next = e.target.checked ? [...selected, idx] : selected.filter((i) => i !== idx);
                        setAnswer({ selectedOptionIndexes: next });
                      }
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {slide.type === "ORDERING" && (
          <textarea
            className="create-quiz-input create-quiz-textarea"
            placeholder="Nhập theo thứ tự đúng, mỗi dòng 1 mục"
            value={(current.orderedItems || []).join("\n")}
            onChange={(e) => setAnswer({ orderedItems: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
          />
        )}

        {slide.type === "TEXT" && (
          <input
            className="create-quiz-input"
            placeholder="Nhập đáp án"
            value={current.textAnswer || ""}
            onChange={(e) => setAnswer({ textAnswer: e.target.value })}
          />
        )}
      </article>

      <div className="my-quiz-actions">
        {index > 0 && <button onClick={prevSlide}>Prev</button>}
        {index < quiz.slides.length - 1 && <button onClick={nextSlide}>Next</button>}
        <button className="secondary" onClick={submitAttempt} disabled={submitted}>
          {submitted ? "Đã nộp bài" : "Nộp bài"}
        </button>
      </div>

      {leaderboard.length > 0 && (
        <div className="slide-card">
          <h3>Bảng xếp hạng</h3>
          <ul>
            {leaderboard.slice(0, 10).map((row) => (
              <li key={`${row.rank}-${row.username}`}>
                #{row.rank} {row.username} - {row.score} điểm ({row.correctCount} đúng, {Math.round(row.totalDurationMs / 1000)}s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default PlayQuizPage;
