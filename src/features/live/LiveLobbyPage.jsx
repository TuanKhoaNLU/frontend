import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/client";
import { getJwtUsername } from "../auth/tokenStorage";
import { useLiveSession } from "./useLiveSession";
import "./LiveQuizPages.css";

function LiveLobbyPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { session, leaderboard, error, setSession, setLeaderboard, setError } = useLiveSession(sessionId);
  const [busy, setBusy] = useState(false);
  const navigatedToPlayRef = useRef(false);

  const jwtUser = getJwtUsername();
  const myParticipantId = sessionStorage.getItem(`live:${sessionId}:participant`);
  const isHost =
    Boolean(session?.hostUsername && jwtUser && session.hostUsername.toLowerCase() === jwtUser.toLowerCase());
  const meInLobby = session?.participants?.find((p) => String(p.participantId) === myParticipantId);
  const isPlayer = Boolean(meInLobby && meInLobby.role === "PLAYER");

  // Hook useLiveSession tự động fetch dữ liệu và đăng ký WebSocket STOMP.
  // Không cần setInterval nữa.

  useEffect(() => {
    if (!session || navigatedToPlayRef.current) return;
    if (session.status === "IN_PROGRESS" && isPlayer && !isHost) {
      navigatedToPlayRef.current = true;
      navigate(`/live/play/${sessionId}`, {
        replace: true,
        state: {
          participantId: Number(myParticipantId),
          displayName: sessionStorage.getItem(`live:${sessionId}:name`) || ""
        }
      });
    }
  }, [session, isPlayer, isHost, navigate, sessionId, myParticipantId]);

  const doHostAction = async (path) => {
    setBusy(true);
    setError("");
    try {
      const res = await apiClient.post(path);
      setSession(res.data);
      const lb = await apiClient.get(`/live/sessions/${sessionId}/leaderboard`);
      setLeaderboard(lb.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  };

  if (!session && error) {
    return (
      <section className="create-quiz live-page">
        <p className="my-quizzes-error">{error}</p>
        <Link to="/live/join">← Join PIN</Link>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="create-quiz live-page">
        <p>Đang tải lobby...</p>
      </section>
    );
  }

  const status = session.status;
  const playersOnly = (session.participants || []).filter((p) => p.role === "PLAYER");
  const joinUrl = `${window.location.origin}/live/join`;

  return (
    <section className="create-quiz live-page">
      <div className="live-page-head">
        <h2 className="live-page-title">{session.quizTitle}</h2>
        <p className="live-page-sub">
          <span className="live-status-pill">{status === "WAITING" ? "Phòng chờ" : status}</span>
          {isHost ? " · Bạn là host" : isPlayer ? " · Bạn là người chơi" : ""}
        </p>
      </div>

      {error && <p className="my-quizzes-error">{error}</p>}

      <div className="slide-card">
        <p className="live-muted">Gửi bạn bè: mở {joinUrl} và nhập PIN bên dưới.</p>
        <div className="live-pin-display" aria-label="PIN">
          {session.pin}
        </div>
        <p className="live-muted">
          Người chơi trong lobby: <strong>{playersOnly.length}</strong> (chưa tính host)
        </p>
      </div>

      <div className="slide-card">
        <h3 style={{ marginTop: 0 }}>Trong phòng</h3>
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {(session.participants || []).map((p) => (
            <li key={p.participantId}>
              {p.displayName}
              {p.host ? " (host)" : " (người chơi)"}
              {!p.connected ? " — offline?" : ""}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <div className="slide-card">
          <h3 style={{ marginTop: 0 }}>Điều khiển</h3>
          {status === "WAITING" && (
            <p className="live-muted">Khi đủ người hoặc khi bạn sẵn sàng, bấm Bắt đầu để mọi người cùng vào làm bài.</p>
          )}
          {status === "IN_PROGRESS" && (
            <p className="live-muted">
              Câu {(session.currentQuestionIndex ?? 0) + 1} / {session.totalQuestions}
            </p>
          )}
          <div className="live-host-actions">
            <button type="button" disabled={busy || status !== "WAITING"} onClick={() => doHostAction(`/live/sessions/${sessionId}/start`)}>
              Bắt đầu
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy || status !== "IN_PROGRESS"}
              onClick={() => doHostAction(`/live/sessions/${sessionId}/next`)}
            >
              Câu tiếp theo
            </button>
            <button type="button" className="danger" disabled={busy || status === "FINISHED"} onClick={() => doHostAction(`/live/sessions/${sessionId}/end`)}>
              Kết thúc
            </button>
          </div>
        </div>
      )}

      {!isHost && status === "WAITING" && (
        <div className="slide-card">
          <p className="live-muted">Đang chờ host bắt đầu game...</p>
        </div>
      )}

      {isHost && status === "IN_PROGRESS" && (
        <p className="live-muted">Người chơi đang làm bài trên màn riêng; bảng điểm cập nhật sau mỗi câu.</p>
      )}

      <div className="slide-card live-leaderboard">
        <h3>Bảng điểm (chỉ người chơi trong phòng)</h3>
        {leaderboard.length === 0 ? (
          <p className="live-muted">Chưa có điểm hoặc chưa có người chơi.</p>
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

      {(status === "FINISHED" || status === "CANCELLED") && (
        <p className="live-muted">
          <Link to="/">← Về trang chủ</Link> · <Link to="/live/join">Phòng khác</Link>
        </p>
      )}

      <p className="live-muted">
        <Link to="/">Trang chủ</Link>
        {isHost && (
          <>
            {" · "}
            <Link to="/">Danh sách quiz</Link>
          </>
        )}
      </p>
    </section>
  );
}

export default LiveLobbyPage;
