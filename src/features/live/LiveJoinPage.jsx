import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../api/client";
import "./LiveQuizPages.css";

function LiveJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState("");

  useEffect(() => {
    const p = searchParams.get("pin");
    if (p) setPin(p);
  }, [searchParams]);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiClient.post("/live/sessions/join", {
        pin: pin.trim(),
        displayName: displayName.trim()
      });
      const { participantId, session } = response.data;
      const sid = session?.sessionId;
      if (!participantId || !sid) {
        setError("Phản hồi server không hợp lệ.");
        return;
      }
      sessionStorage.setItem(`live:${sid}:participant`, String(participantId));
      sessionStorage.setItem(`live:${sid}:name`, displayName.trim());
      navigate(`/live/lobby/${sid}`, { state: { participantId, displayName: displayName.trim() } });
    } catch (err) {
      setError(err?.response?.data?.message || "Không vào được phòng. Kiểm tra PIN và tên hiển thị.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-quiz live-page">
      <div className="live-page-head">
        <h2 className="live-page-title">Vào phòng live</h2>
        <p className="live-page-sub">Nhập PIN do host cung cấp và tên hiển thị (2–30 ký tự).</p>
      </div>
      <form className="slide-card" onSubmit={handleJoin}>
        <label className="create-quiz-label">
          PIN
          <input
            className="create-quiz-input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Ví dụ: 123456"
            autoComplete="off"
            maxLength={12}
          />
        </label>
        <label className="create-quiz-label">
          Tên hiển thị
          <input
            className="create-quiz-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ví dụ: Alex"
            minLength={2}
            maxLength={30}
          />
        </label>
        {error && <p className="my-quizzes-error">{error}</p>}
        <div className="my-quiz-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Đang vào..." : "Vào phòng"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default LiveJoinPage;
