import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/client";

/**
 * Creates a live session for the given quiz, then sends the host to the shared lobby.
 */
function LiveHostPage({ isLoggedIn }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const createdRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !quizId || createdRef.current) return;
    createdRef.current = true;

    const run = async () => {
      try {
        const res = await apiClient.post("/live/sessions", {
          quizId: Number(quizId),
          allowLateJoin: true
        });
        const sid = res.data?.sessionId;
        if (!sid) {
          createdRef.current = false;
          setError("Phản hồi server không hợp lệ.");
          return;
        }
        navigate(`/live/lobby/${sid}`, { replace: true });
      } catch (err) {
        createdRef.current = false;
        setError(err?.response?.data?.message || "Không tạo được phòng live.");
      }
    };
    run();
  }, [isLoggedIn, quizId, navigate]);

  if (!isLoggedIn) {
    return (
      <section className="my-quizzes-locked">
        <h2>Tạo phòng live</h2>
        <p>Bạn cần đăng nhập để tạo phòng từ quiz trên web.</p>
        <Link className="my-quizzes-login" to="/login">
          Đăng nhập
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="create-quiz live-page">
        <p className="my-quizzes-error">{error}</p>
        <Link to="/">← Quay lại danh sách quiz</Link>
      </section>
    );
  }

  return (
    <section className="create-quiz live-page">
      <p>Đang tạo phòng và chuyển tới lobby...</p>
    </section>
  );
}

export default LiveHostPage;
