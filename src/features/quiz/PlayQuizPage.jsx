import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../api/client";
import "./CreateQuizPage.css";
import "./PlayQuizPage.css";

const REVEAL_HOLD_MS = 2200;
const NORMAL_SLIDE_SECONDS = 20;

function normalizeTextList(values) {
  return (values || []).map((v) => (v == null ? "" : v.trim().toLowerCase())).filter(Boolean);
}

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
  const [slideLimitSec, setSlideLimitSec] = useState(10);
  const [timerPhase, setTimerPhase] = useState("idle"); // idle | reading | answering | revealed
  const [slideTimerStartedAt, setSlideTimerStartedAt] = useState(null);
  const [slideRevealed, setSlideRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameConfirmed, setNicknameConfirmed] = useState(false);

  const intervalRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const submittingRef = useRef(false);
  const answersRef = useRef(answers);
  const revealSlideRef = useRef(() => {});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = useMemo(() => {
    if (!quiz?.slides?.length) return 0;
    return Math.round((answeredCount / quiz.slides.length) * 100);
  }, [answeredCount, quiz?.slides?.length]);

  const slide = useMemo(() => (quiz?.slides ? quiz.slides[index] : null), [quiz, index]);
  const current = slide ? answers[slide.slideId] || {} : {};
  const isLocked = Boolean(current.locked);
  const isSingleChoice = slide?.type === "SINGLE_CHOICE";
  const canSelect = nicknameConfirmed && slide && !slideRevealed && !finished && (!isLocked || !isSingleChoice);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/attempts/quiz/${quizId}`);
        setQuiz(response.data);
        setStartedAt(Date.now());
        setFinished(false);
        setFinalResult(null);
        setNicknameConfirmed(false);
        setIndex(0);
        setAnswers({});
        setSlideRevealed(false);
      } catch (err) {
        setError(err?.response?.data?.message || "Không tải được quiz.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  const submitAttempt = useCallback(async () => {
    if (submittingRef.current || finished) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await apiClient.post("/attempts/submit", {
        nickname,
        quizId: Number(quizId),
        totalDurationMs: Date.now() - startedAt,
        answers: Object.values(answersRef.current)
      });
      setLeaderboard(response.data.leaderboard || []);
      setFinalResult(response.data);
      setFinished(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Nộp bài thất bại.");
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [finished, nickname, quizId, startedAt]);

  const goToNextSlide = useCallback(() => {
    if (!quiz) return;
    if (index >= quiz.slides.length - 1) {
      submitAttempt();
      return;
    }
    setIndex((prev) => prev + 1);
    setSlideRevealed(false);
    setCountdown(null);
    setTimerPhase("idle");
    setSlideTimerStartedAt(null);
  }, [index, quiz, submitAttempt]);

  const scheduleAdvance = useCallback(() => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(() => {
      goToNextSlide();
    }, REVEAL_HOLD_MS);
  }, [goToNextSlide]);

  const finalizeSlideAnswer = useCallback(() => {
    if (!slide) return;
    const elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
    setAnswers((prev) => {
      const existing = prev[slide.slideId] || { slideId: slide.slideId };
      return {
        ...prev,
        [slide.slideId]: {
          ...existing,
          slideId: slide.slideId,
          elapsedMs: existing.elapsedMs ?? elapsedMs,
          locked: true
        }
      };
    });
  }, [slide, slideTimerStartedAt]);

  const revealCurrentSlide = useCallback(() => {
    finalizeSlideAnswer();
    setSlideRevealed(true);
    setTimerPhase("revealed");
    setCountdown(0);
    scheduleAdvance();
  }, [finalizeSlideAnswer, scheduleAdvance]);

  useEffect(() => {
    revealSlideRef.current = revealCurrentSlide;
  }, [revealCurrentSlide]);

  const lockAnswer = useCallback(
    (patch) => {
      if (!slide || !canSelect) return;
      const elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
      setAnswers((prev) => ({
        ...prev,
        [slide.slideId]: {
          slideId: slide.slideId,
          elapsedMs,
          locked: true,
          ...prev[slide.slideId],
          ...patch
        }
      }));
    },
    [canSelect, slide, slideTimerStartedAt]
  );

  const handleSingleChoice = (idx) => {
    if (!canSelect) return;
    lockAnswer({ selectedOptionIndexes: [idx] });
  };

  const handleMultiChoice = (idx, checked) => {
    if (!canSelect || slideRevealed) return;
    const selected = current.selectedOptionIndexes || [];
    const next = checked ? [...selected, idx] : selected.filter((i) => i !== idx);
    const elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
    setAnswers((prev) => ({
      ...prev,
      [slide.slideId]: {
        slideId: slide.slideId,
        elapsedMs,
        locked: false,
        ...prev[slide.slideId],
        selectedOptionIndexes: next
      }
    }));
  };

  const handleOrderingChange = (value) => {
    if (!canSelect || slideRevealed) return;
    const items = value.split("\n").map((v) => v.trim()).filter(Boolean);
    const elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
    setAnswers((prev) => ({
      ...prev,
      [slide.slideId]: {
        slideId: slide.slideId,
        elapsedMs,
        locked: false,
        ...prev[slide.slideId],
        orderedItems: items
      }
    }));
  };

  const handleTextChange = (value) => {
    if (!canSelect || slideRevealed) return;
    const elapsedMs = Math.max(0, Date.now() - (slideTimerStartedAt || Date.now()));
    setAnswers((prev) => ({
      ...prev,
      [slide.slideId]: {
        slideId: slide.slideId,
        elapsedMs,
        locked: false,
        ...prev[slide.slideId],
        textAnswer: value
      }
    }));
  };

  useEffect(() => {
    if (!slide || !nicknameConfirmed || finished) return;

    setSlideRevealed(false);
    setSlideTimerStartedAt(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const revealMs = quiz?.mode === "TIME" ? slide.revealDurationMs || 0 : 0;
    const limitSec =
      quiz?.mode === "TIME"
        ? slide.timeLimitSeconds || 10
        : slide.timeLimitSeconds || NORMAL_SLIDE_SECONDS;

    setSlideLimitSec(limitSec);

    const startAnswerTimer = () => {
      const timerStart = Date.now();
      setSlideTimerStartedAt(timerStart);
      setTimerPhase("answering");
      setCountdown(limitSec);

      const endAt = timerStart + limitSec * 1000;
      const tick = () => {
        const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setCountdown(left);
        if (left <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          revealSlideRef.current();
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 200);
    };

    let revealTimeoutId;
    if (revealMs > 0) {
      setTimerPhase("reading");
      setCountdown(Math.max(1, Math.ceil(revealMs / 1000)));
      revealTimeoutId = setTimeout(() => {
        startAnswerTimer();
      }, revealMs);
    } else {
      startAnswerTimer();
    }

    return () => {
      clearTimeout(revealTimeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [slide?.slideId, quiz?.mode, nicknameConfirmed, finished, index]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const getOptionClass = (idx) => {
    const classes = ["slide-option-row"];
    const selected = current.selectedOptionIndexes || [];
    const correct = slide.correctOptionIndexes || [];

    if (isLocked && selected.includes(idx)) {
      classes.push("slide-option-row--selected");
    }
    if (!slideRevealed) return classes.join(" ");

    if (correct.includes(idx)) {
      classes.push("slide-option-row--correct");
    }
    if (selected.includes(idx) && !correct.includes(idx)) {
      classes.push("slide-option-row--wrong");
    }
    classes.push("slide-option-row--locked");
    return classes.join(" ");
  };

  const isOrderingCorrect =
    slideRevealed &&
    normalizeTextList(current.orderedItems).join("|") ===
      normalizeTextList(slide.correctOrderingItems).join("|");

  const isTextCorrect =
    slideRevealed &&
    normalizeTextList(slide.acceptedAnswers).includes((current.textAnswer || "").trim().toLowerCase());

  if (loading) return <p className="play-quiz-loading">Đang tải quiz...</p>;
  if (error && !quiz) return <p className="play-quiz-error">{error}</p>;
  if (!quiz || !slide) return <p>Quiz không có dữ liệu.</p>;

  if (!nicknameConfirmed) {
    return (
      <section className="create-quiz play-quiz-page">
        <div className="create-quiz-head">
          <h2 className="create-quiz-title">{quiz.title}</h2>
          <p className="create-quiz-subtitle">Nhập nickname để bắt đầu làm quiz.</p>
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
          {error && <p className="create-quiz-error">{error}</p>}
          <div className="my-quiz-actions">
            <button
              type="button"
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
                setIndex(0);
                setAnswers({});
              }}
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (finished && finalResult) {
    return (
      <section className="create-quiz play-quiz-page">
        <div className="create-quiz-head">
          <h2 className="create-quiz-title">Hoàn thành!</h2>
          <p className="create-quiz-subtitle">
            Điểm: {finalResult.score} • Đúng {finalResult.correctCount}/{finalResult.totalQuestions} câu
          </p>
        </div>
        {leaderboard.length > 0 && (
          <div className="slide-card">
            <h3>Bảng xếp hạng</h3>
            <ul>
              {leaderboard.slice(0, 10).map((row) => (
                <li key={`${row.rank}-${row.username}`}>
                  #{row.rank} {row.username} — {row.score} điểm ({row.correctCount} đúng)
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="create-quiz play-quiz-page">
      <div className="create-quiz-head">
        <h2 className="create-quiz-title">{quiz.title}</h2>
        <p className="create-quiz-subtitle">
          Câu {index + 1}/{quiz.slides.length}
          <span className="play-quiz-nickname">{` • ${nickname}`}</span>
          {submitting && <span className="play-quiz-submitting">Đang nộp bài...</span>}
        </p>
        <div
          className="play-quiz-progress"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="play-quiz-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div
        className={`play-quiz-timer-panel play-quiz-timer-panel--${timerPhase}`}
        role="status"
        aria-live="polite"
      >
        {timerPhase === "reading" && (
          <>
            <span className="play-quiz-timer-panel__label">Đang hiển thị câu hỏi</span>
            <span className="play-quiz-timer-panel__value">{countdown ?? 0}s</span>
          </>
        )}
        {timerPhase === "answering" && (
          <>
            <span className="play-quiz-timer-panel__label">Thời gian trả lời</span>
            <span
              className={`play-quiz-timer-panel__value ${(countdown ?? 0) <= 5 ? "play-quiz-timer-panel__value--urgent" : ""}`}
            >
              {countdown ?? 0}s
            </span>
            <div className="play-quiz-timer-panel__bar">
              <div
                className="play-quiz-timer-panel__bar-fill"
                style={{
                  width: `${slideLimitSec > 0 ? Math.max(0, ((countdown ?? 0) / slideLimitSec) * 100) : 0}%`
                }}
              />
            </div>
          </>
        )}
        {timerPhase === "revealed" && (
          <>
            <span className="play-quiz-timer-panel__label">Kết quả câu hỏi</span>
            <span className="play-quiz-timer-panel__value play-quiz-timer-panel__value--reveal">Đáp án đúng</span>
          </>
        )}
        {timerPhase === "idle" && (
          <>
            <span className="play-quiz-timer-panel__label">Chuẩn bị</span>
            <span className="play-quiz-timer-panel__value">...</span>
          </>
        )}
      </div>

      {error && <p className="create-quiz-error">{error}</p>}

      <article className={`slide-card ${slideRevealed ? "slide-card--revealed" : ""}`}>
        <h3>{slide.question}</h3>
        {slide.imageUrl && <img src={slide.imageUrl} alt="" />}

        {(slide.type === "SINGLE_CHOICE" || slide.type === "MULTI_CHOICE") && (
          <div className="slide-options">
            {(slide.options || []).map((option, idx) => {
              const selected = current.selectedOptionIndexes || [];
              const isSingle = slide.type === "SINGLE_CHOICE";
              return (
                <label key={idx} className={getOptionClass(idx)}>
                  <input
                    type={isSingle ? "radio" : "checkbox"}
                    name={`slide-${slide.slideId}`}
                    checked={selected.includes(idx)}
                    disabled={!canSelect}
                    onChange={(e) => {
                      if (isSingle) {
                        handleSingleChoice(idx);
                      } else {
                        handleMultiChoice(idx, e.target.checked);
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
          <>
            <textarea
              className={`create-quiz-input create-quiz-textarea ${slideRevealed ? (isOrderingCorrect ? "play-input--correct" : "play-input--wrong") : ""}`}
              placeholder="Nhập theo thứ tự đúng, mỗi dòng 1 mục"
              value={(current.orderedItems || []).join("\n")}
              disabled={!canSelect}
              onChange={(e) => handleOrderingChange(e.target.value)}
            />
            {slideRevealed && (
              <p className="play-reveal-answer">
                Đáp án đúng: {(slide.correctOrderingItems || []).join(" → ")}
              </p>
            )}
          </>
        )}

        {slide.type === "TEXT" && (
          <>
            <input
              className={`create-quiz-input ${slideRevealed ? (isTextCorrect ? "play-input--correct" : "play-input--wrong") : ""}`}
              placeholder="Nhập đáp án"
              value={current.textAnswer || ""}
              disabled={!canSelect}
              onChange={(e) => handleTextChange(e.target.value)}
            />
            {slideRevealed && (
              <p className="play-reveal-answer">
                Đáp án đúng: {(slide.acceptedAnswers || []).join(", ")}
              </p>
            )}
          </>
        )}

        {isLocked && isSingleChoice && !slideRevealed && (
          <p className="play-locked-hint">Đã chọn — chờ hết thời gian để xem kết quả.</p>
        )}
      </article>
    </section>
  );
}

export default PlayQuizPage;
