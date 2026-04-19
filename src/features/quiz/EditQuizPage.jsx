import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/client";
import "./CreateQuizPage.css";

const slideTypes = [
  { value: "SINGLE_CHOICE", label: "1 đáp án đúng" },
  { value: "MULTI_CHOICE", label: "Nhiều đáp án đúng" },
  { value: "ORDERING", label: "Sắp xếp thứ tự" },
  { value: "TEXT", label: "Tự luận điền đáp án" }
];

function createEmptySlide() {
  return {
    type: "SINGLE_CHOICE",
    question: "",
    imageUrl: "",
    options: ["", "", "", ""],
    correctOptionIndexes: [0],
    orderingItems: ["", ""],
    acceptedAnswersText: ""
  };
}

function mapApiSlideToForm(slide) {
  if (slide.type === "SINGLE_CHOICE" || slide.type === "MULTI_CHOICE") {
    const options = (slide.options || []).slice(0, 4);
    while (options.length < 4) options.push("");
    return {
      type: slide.type,
      question: slide.question || "",
      imageUrl: slide.imageUrl || "",
      options,
      correctOptionIndexes: slide.correctOptionIndexes?.length ? slide.correctOptionIndexes : [0],
      orderingItems: ["", ""],
      acceptedAnswersText: ""
    };
  }
  if (slide.type === "ORDERING") {
    return {
      type: "ORDERING",
      question: slide.question || "",
      imageUrl: slide.imageUrl || "",
      options: ["", "", "", ""],
      correctOptionIndexes: [0],
      orderingItems: slide.orderingItems?.length ? slide.orderingItems : ["", ""],
      acceptedAnswersText: ""
    };
  }
  return {
    type: "TEXT",
    question: slide.question || "",
    imageUrl: slide.imageUrl || "",
    options: ["", "", "", ""],
    correctOptionIndexes: [0],
    orderingItems: ["", ""],
    acceptedAnswersText: (slide.acceptedAnswers || []).join("\n")
  };
}

function EditQuizPage({ isLoggedIn }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(true);
  const [slides, setSlides] = useState([createEmptySlide()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => title.trim().length > 0 && slides.length > 0, [title, slides.length]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get(`/quizzes/${quizId}/mine`);
        const data = response.data;
        setTitle(data.title || "");
        setPublished(Boolean(data.published));
        setSlides((data.slides || []).map(mapApiSlideToForm));
      } catch (err) {
        setError(err?.response?.data?.message || "Không tải được quiz để chỉnh sửa.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <section className="create-quiz-locked">
        <h2 className="create-quiz-title">Edit Quiz</h2>
        <p>Bạn cần đăng nhập trước.</p>
        <Link className="create-quiz-login" to="/login">
          Đi tới đăng nhập
        </Link>
      </section>
    );
  }

  if (loading) {
    return <p>Đang tải quiz...</p>;
  }

  const updateSlide = (index, patch) => {
    setSlides((prev) => prev.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  };

  const updateOption = (slideIndex, optionIndex, value) => {
    setSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide;
        const options = slide.options.map((opt, idx) => (idx === optionIndex ? value : opt));
        return { ...slide, options };
      })
    );
  };

  const setSingleCorrect = (slideIndex, optionIndex) => {
    updateSlide(slideIndex, { correctOptionIndexes: [optionIndex] });
  };

  const toggleMultiCorrect = (slideIndex, optionIndex) => {
    setSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide;
        const exists = slide.correctOptionIndexes.includes(optionIndex);
        const next = exists
          ? slide.correctOptionIndexes.filter((idx) => idx !== optionIndex)
          : [...slide.correctOptionIndexes, optionIndex];
        return { ...slide, correctOptionIndexes: next };
      })
    );
  };

  const updateOrderingItem = (slideIndex, itemIndex, value) => {
    setSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide;
        const orderingItems = slide.orderingItems.map((item, idx) => (idx === itemIndex ? value : item));
        return { ...slide, orderingItems };
      })
    );
  };

  const addOrderingItem = (slideIndex) => {
    setSlides((prev) =>
      prev.map((slide, i) => (i === slideIndex ? { ...slide, orderingItems: [...slide.orderingItems, ""] } : slide))
    );
  };

  const removeOrderingItem = (slideIndex, itemIndex) => {
    setSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex || slide.orderingItems.length <= 2) return slide;
        return { ...slide, orderingItems: slide.orderingItems.filter((_, idx) => idx !== itemIndex) };
      })
    );
  };

  const addSlide = () => setSlides((prev) => [...prev, createEmptySlide()]);
  const removeSlide = (index) => setSlides((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const buildPayload = () => ({
    title: title.trim(),
    published,
    slides: slides.map((slide) => {
      const base = {
        type: slide.type,
        question: slide.question.trim(),
        imageUrl: slide.imageUrl.trim()
      };
      if (slide.type === "SINGLE_CHOICE" || slide.type === "MULTI_CHOICE") {
        return {
          ...base,
          options: slide.options.map((opt) => opt.trim()),
          correctOptionIndexes: slide.correctOptionIndexes
        };
      }
      if (slide.type === "ORDERING") {
        return {
          ...base,
          orderingItems: slide.orderingItems.map((item) => item.trim())
        };
      }
      return {
        ...base,
        acceptedAnswers: slide.acceptedAnswersText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      };
    })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await apiClient.put(`/quizzes/${quizId}/content`, buildPayload());
      setSuccess("Cập nhật quiz thành công.");
      setTimeout(() => navigate("/my-quizzes"), 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Cập nhật quiz thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-quiz">
      <div className="create-quiz-head">
        <h2 className="create-quiz-title">Edit Quiz #{quizId}</h2>
        <p className="create-quiz-subtitle">Chỉnh sửa toàn bộ slide và đáp án.</p>
      </div>
      <form className="create-quiz-form" onSubmit={handleSubmit}>
        <label className="create-quiz-label">
          Quiz title
          <input className="create-quiz-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="create-quiz-switch">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>

        {slides.map((slide, index) => (
          <article className="slide-card" key={`slide-${index}`}>
            <div className="slide-card-top">
              <h3>Slide {index + 1}</h3>
              <button type="button" className="slide-remove" onClick={() => removeSlide(index)}>
                Xóa slide
              </button>
            </div>
            <label className="create-quiz-label">
              Loại câu hỏi
              <select
                className="create-quiz-input"
                value={slide.type}
                onChange={(e) => updateSlide(index, { type: e.target.value, correctOptionIndexes: [0] })}
              >
                {slideTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="create-quiz-label">
              Câu hỏi
              <textarea
                className="create-quiz-input create-quiz-textarea"
                value={slide.question}
                onChange={(e) => updateSlide(index, { question: e.target.value })}
                required
              />
            </label>
            <label className="create-quiz-label">
              Ảnh minh họa (URL)
              <input
                className="create-quiz-input"
                type="url"
                value={slide.imageUrl}
                onChange={(e) => updateSlide(index, { imageUrl: e.target.value })}
              />
            </label>

            {(slide.type === "SINGLE_CHOICE" || slide.type === "MULTI_CHOICE") && (
              <div className="slide-options">
                {slide.options.map((option, optionIndex) => (
                  <div className="slide-option-row" key={`opt-${optionIndex}`}>
                    {slide.type === "SINGLE_CHOICE" ? (
                      <input
                        type="radio"
                        name={`single-${index}`}
                        checked={slide.correctOptionIndexes[0] === optionIndex}
                        onChange={() => setSingleCorrect(index, optionIndex)}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={slide.correctOptionIndexes.includes(optionIndex)}
                        onChange={() => toggleMultiCorrect(index, optionIndex)}
                      />
                    )}
                    <input
                      className="create-quiz-input"
                      value={option}
                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {slide.type === "ORDERING" && (
              <div className="slide-ordering">
                {slide.orderingItems.map((item, itemIndex) => (
                  <div className="slide-option-row" key={`order-${itemIndex}`}>
                    <span className="slide-order-index">{itemIndex + 1}</span>
                    <input
                      className="create-quiz-input"
                      value={item}
                      onChange={(e) => updateOrderingItem(index, itemIndex, e.target.value)}
                    />
                    <button type="button" className="slide-inline-button" onClick={() => removeOrderingItem(index, itemIndex)}>
                      Xóa
                    </button>
                  </div>
                ))}
                <button type="button" className="slide-inline-button" onClick={() => addOrderingItem(index)}>
                  + Thêm mục
                </button>
              </div>
            )}

            {slide.type === "TEXT" && (
              <label className="create-quiz-label">
                Các đáp án chấp nhận (mỗi dòng 1 đáp án)
                <textarea
                  className="create-quiz-input create-quiz-textarea"
                  rows={4}
                  value={slide.acceptedAnswersText}
                  onChange={(e) => updateSlide(index, { acceptedAnswersText: e.target.value })}
                />
              </label>
            )}
          </article>
        ))}

        <button type="button" className="create-quiz-add-slide" onClick={addSlide}>
          + Thêm slide
        </button>
        <div className="create-quiz-actions">
          <button className="create-quiz-submit" type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu cập nhật"}
          </button>
        </div>
        {error && <p className="create-quiz-error">{error}</p>}
        {success && <p className="create-quiz-success">{success}</p>}
      </form>
    </section>
  );
}

export default EditQuizPage;
