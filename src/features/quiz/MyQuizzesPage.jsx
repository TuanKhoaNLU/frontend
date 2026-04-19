import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";
import "./MyQuizzesPage.css";

function MyQuizzesPage({ isLoggedIn }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadMyQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/quizzes/mine");
      setQuizzes(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Không tải được danh sách quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadMyQuizzes();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <section className="my-quizzes-locked">
        <h2>My Quizzes</h2>
        <p>Bạn cần đăng nhập để quản lý quiz đã tạo.</p>
        <Link className="my-quizzes-login" to="/login">
          Đăng nhập
        </Link>
      </section>
    );
  }

  const hideQuiz = async (quizId) => {
    setBusyId(quizId);
    setError("");
    try {
      const response = await apiClient.patch(`/quizzes/${quizId}/hide`);
      setQuizzes((prev) => prev.map((quiz) => (quiz.id === quizId ? response.data : quiz)));
    } catch (err) {
      setError(err?.response?.data?.message || "Ẩn quiz thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteQuiz = async (quizId) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xóa quiz này?");
    if (!confirmed) return;
    setBusyId(quizId);
    setError("");
    try {
      await apiClient.delete(`/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
    } catch (err) {
      setError(err?.response?.data?.message || "Xóa quiz thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="my-quizzes">
      <div className="my-quizzes-head">
        <h2>My Quizzes</h2>
        <Link className="my-quizzes-create" to="/create-quiz">
          + Tạo quiz mới
        </Link>
      </div>

      {error && <p className="my-quizzes-error">{error}</p>}
      {loading && <p className="my-quizzes-loading">Đang tải...</p>}

      {!loading && quizzes.length === 0 && <p className="my-quizzes-empty">Bạn chưa tạo quiz nào.</p>}

      <div className="my-quizzes-list">
        {quizzes.map((quiz) => (
          <article className="my-quiz-card" key={quiz.id}>
            <h3>{quiz.title}</h3>
            <p>
              ID #{quiz.id} • {quiz.slideCount} slide • {quiz.published ? "Published" : "Hidden"}
            </p>
            <div className="my-quiz-actions">
              <Link className="my-quiz-edit-content-link" to={`/my-quizzes/${quiz.id}/edit`}>
                Sửa
              </Link>
              <button className="secondary" onClick={() => hideQuiz(quiz.id)} disabled={busyId === quiz.id}>
                Ẩn
              </button>
              <button className="danger" onClick={() => deleteQuiz(quiz.id)} disabled={busyId === quiz.id}>
                Xóa
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MyQuizzesPage;
