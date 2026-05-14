import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/client";
import "./LiveQuizPages.css";

function LivePlayPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [participantId] = useState(() => {
    const fromState = location.state?.participantId;
    if (fromState != null) return Number(fromState);
    const raw = sessionStorage.getItem(`live:${sessionId}:participant`);
    return raw ? Number(raw) : null;
  });
  const [displayName] = useState(() => {
    if (location.state?.displayName) return location.state.displayName;
    return sessionStorage.getItem(`live:${sessionId}:name`) || "";
  });

  const [session, setSession] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitMsg, setLastSubmitMsg] = useState("");
  const [answeredThisSlide, setAnsweredThisSlide] = useState(false);

  const slide = session?.currentSlide;
  const isTimeLike = Boolean(slide?.timeLimitSeconds != null && slide.timeLimitSeconds > 0);

  const [countdown, setCountdown] = useState(null);
  const [slideTimerStartedAt, setSlideTimerStartedAt] = useState(null);
  const intervalRef = useRef(null);
  const lastSlideKeyRef = useRef("");
  const questionStartedAtRef = useRef(Date.now());

  const slideKey = useMemo(() => {
    if (!session || !slide) return "";
    return `${session.currentQuestionIndex}-${slide.slideId}`;
  }, [session, slide]);

  useEffect(() => {
    if (slideKey && slideKey !== lastSlideKeyRef.current) {
      lastSlideKeyRef.current = slideKey;
      setAnsweredThisSlide(false);
      setLastSubmitMsg("");
    }
  }, [slideKey]);

  const poll = useCallback(async () => {
    try {
      const [stateRes, lbRes] = await Promise.all([
        apiClient.get(`/live/sessions/${sessionId}`),
        apiClient.get(`/live/sessions/${sessionId}/leaderboard`)
      ]);
      setSession(stateRes.data);
      setLeaderboard(lbRes.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Không tải được trạng thái phòng.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "WAITING") {
      navigate(`/live/lobby/${sessionId}`, { replace: true });
    }
  }, [session, sessionId, navigate]);

  useEffect(() => {
    if (!slide || !isTimeLike) {
      setCountdown(null);
      setSlideTimerStartedAt(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const serverAnchorMs = session?.currentSlideStartedAt ? new Date(session.currentSlideStartedAt).getTime() : null;

    if (serverAnchorMs != null) {
      setSlideTimerStartedAt(serverAnchorMs);
      const endAt = serverAnchorMs + (slide.timeLimitSeconds || 10) * 1000;
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setCountdown(left);
        if (left <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 250);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
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
        if (left <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
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
  }, [slide, isTimeLike, session?.currentSlideStartedAt]);

  useEffect(() => {
    if (slide && session?.currentSlideStartedAt) {
      questionStartedAtRef.current = new Date(session.currentSlideStartedAt).getTime();
    } else if (slide) {
      questionStartedAtRef.current = Date.now();
    }
  }, [slideKey, slide, session?.currentSlideStartedAt]);

  const buildAnswerPayload = (patch) => {
    if (!slide) return null;
    let elapsedMs;
    if (isTimeLike && session?.currentSlideStartedAt) {
      const anchor = new Date(session.currentSlideStartedAt).getTime();
      elapsedMs = Math.max(0, Date.now() - anchor);
    } else if (isTimeLike) {
      elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
    } else {
      elapsedMs = Math.max(0, Date.now() - questionStartedAtRef.current);
    }
    return {
      slideId: slide.slideId,
      elapsedMs,
      ...patch
    };
  };

  const setAnswerField = (patch) => {
    setLocalAnswer((prev) => ({ ...prev, ...patch }));
  };

  const [localAnswer, setLocalAnswer] = useState({});

  useEffect(() => {
    setLocalAnswer({});
  }, [slideKey]);

  const submitAnswer = async () => {
    if (!slide || participantId == null || answeredThisSlide || submitting) return;
    const answer = buildAnswerPayload(localAnswer);
    if (!answer) return;
    if (answer.slideId == null || answer.elapsedMs == null) {
      setError("Thiếu dữ liệu câu trả lời.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiClient.post(`/live/sessions/${sessionId}/answers`, {
        participantId,
        answer
      });
      setLastSubmitMsg(
        res.data.correct ? `Đúng! +${res.data.scoreEarned} điểm` : `Sai. Điểm cộng: ${res.data.scoreEarned}`
      );
      setLeaderboard(res.data.leaderboard || []);
      setAnsweredThisSlide(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Gửi đáp án thất bại.";
      setError(msg);
      if (msg.includes("already answered")) {
        setAnsweredThisSlide(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (participantId == null || Number.isNaN(participantId)) {
    return (
      <section className="create-quiz live-page">
        <h2 className="live-page-title">Thiếu thông tin người chơi</h2>
        <p className="live-page-sub">Hãy vào phòng bằng trang Join (PIN), không mở trực tiếp URL chơi.</p>
        <Link className="my-quizzes-login" to="/live/join">
          Đi tới Join PIN
        </Link>
      </section>
    );
  }

  if (loading && !session) {
    return (
      <section className="create-quiz live-page">
        <p>Đang kết nối phòng...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="create-quiz live-page">
        <p className="my-quizzes-error">{error || "Không có dữ liệu phòng."}</p>
        <Link to="/live/join">← Join lại</Link>
      </section>
    );
  }

  const status = session.status;

  if (status === "FINISHED" || status === "CANCELLED") {
    return (
      <section className="create-quiz live-page">
        <div className="live-page-head">
          <h2 className="live-page-title">{session.quizTitle}</h2>
          <p className="live-page-sub">Phòng đã kết thúc ({status}).</p>
        </div>
        <div className="slide-card live-leaderboard">
          <h3>Bảng xếp hạng</h3>
          {leaderboard.length === 0 ? (
            <p className="live-muted">Không có dữ liệu.</p>
          ) : (
            <ol>
              {leaderboard.map((row) => (
                <li key={row.participantId}>
                  #{row.rank} {row.displayName} — {row.score} điểm ({row.correctCount} đúng)
                </li>
              ))}
            </ol>
          )}
        </div>
        <Link to="/live/join">← Chơi phòng khác</Link>
      </section>
    );
  }

  if (status === "WAITING") {
    return (
      <section className="create-quiz live-page">
        <div className="live-page-head">
          <h2 className="live-page-title">{session.quizTitle}</h2>
          <p className="live-page-sub">
            Xin chào <strong>{displayName || "bạn"}</strong>. Đang chờ host bắt đầu...
          </p>
        </div>
        <p className="live-muted">PIN phòng: {session.pin}</p>
        {error && <p className="my-quizzes-error">{error}</p>}
      </section>
    );
  }

  if (!slide) {
    return (
      <section className="create-quiz live-page">
        <p className="live-page-title">{session.quizTitle}</p>
        <p className="live-muted">Đang tải câu hỏi...</p>
        {error && <p className="my-quizzes-error">{error}</p>}
      </section>
    );
  }

  const current = localAnswer;

  return (
    <section className="create-quiz live-page">
      <div className="live-page-head">
        <h2 className="live-page-title">{session.quizTitle}</h2>
        <p className="live-page-sub">
          {displayName ? `${displayName} • ` : ""}
          Câu {session.currentQuestionIndex + 1}/{session.totalQuestions}
          {isTimeLike && typeof countdown === "number" ? ` • Còn lại: ${countdown}s` : ""}
        </p>
      </div>

      {error && <p className="my-quizzes-error">{error}</p>}
      {lastSubmitMsg && <p className="live-muted">{lastSubmitMsg}</p>}

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
                    name={`live-q-${slide.slideId}`}
                    checked={selected.includes(idx)}
                    disabled={answeredThisSlide}
                    onChange={(e) => {
                      if (slide.type === "SINGLE_CHOICE") {
                        setAnswerField({ selectedOptionIndexes: [idx] });
                      } else {
                        const next = e.target.checked ? [...selected, idx] : selected.filter((i) => i !== idx);
                        setAnswerField({ selectedOptionIndexes: next });
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
            disabled={answeredThisSlide}
            value={(current.orderedItems || []).join("\n")}
            onChange={(e) =>
              setAnswerField({
                orderedItems: e.target.value
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean)
              })
            }
          />
        )}

        {slide.type === "TEXT" && (
          <input
            className="create-quiz-input"
            placeholder="Nhập đáp án"
            disabled={answeredThisSlide}
            value={current.textAnswer || ""}
            onChange={(e) => setAnswerField({ textAnswer: e.target.value })}
          />
        )}
      </article>

      <div className="my-quiz-actions">
        <button type="button" onClick={submitAnswer} disabled={answeredThisSlide || submitting}>
          {answeredThisSlide ? "Đã gửi đáp án" : submitting ? "Đang gửi..." : "Gửi đáp án"}
        </button>
      </div>

      {leaderboard.length > 0 && (
        <div className="slide-card live-leaderboard">
          <h3>Bảng xếp hạng</h3>
          <ol>
            {leaderboard.slice(0, 15).map((row) => (
              <li key={row.participantId}>
                #{row.rank} {row.displayName} — {row.score} điểm
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export default LivePlayPage;
