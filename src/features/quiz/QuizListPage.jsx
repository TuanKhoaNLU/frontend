import { useEffect, useState } from "react";
import apiClient from "../../api/client";

function QuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await apiClient.get("/quizzes");
        setQuizzes(response.data);
      } catch (err) {
        setError("Cannot load quizzes. Start backend first.");
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <section>
      <h2>Available Quizzes</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {quizzes.map((quiz) => (
          <li key={quiz.id}>
            {quiz.title} - {quiz.published ? "Published" : "Draft"}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default QuizListPage;
