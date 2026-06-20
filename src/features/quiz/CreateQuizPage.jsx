import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    acceptedAnswersText: "",
    timeLimitSeconds: 15
  };
}

function CreateQuizPage({ isLoggedIn }) {
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(true);
  const [mode, setMode] = useState("NORMAL");
  const [totalTimeLimitSeconds, setTotalTimeLimitSeconds] = useState("");
  const [slides, setSlides] = useState([createEmptySlide()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => title.trim().length > 0 && slides.length > 0, [title, slides.length]);

  if (!isLoggedIn) {
    return (
      <section className="create-quiz-locked">
        <h2 className="create-quiz-title">Create Quiz</h2>
        <p>Bạn cần đăng nhập trước khi tạo quiz.</p>
        <Link className="create-quiz-login" to="/login">
          Đi tới trang đăng nhập
        </Link>
      </section>
    );
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
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide;
        return { ...slide, orderingItems: [...slide.orderingItems, ""] };
      })
    );
  };

  const removeOrderingItem = (slideIndex, itemIndex) => {
    setSlides((prev) =>
      prev.map((slide, i) => {
        if (i !== slideIndex) return slide;
        if (slide.orderingItems.length <= 2) return slide;
        return { ...slide, orderingItems: slide.orderingItems.filter((_, idx) => idx !== itemIndex) };
      })
    );
  };

  const addSlide = () => {
    setSlides((prev) => [...prev, createEmptySlide()]);
  };

  const removeSlide = (index) => {
    setSlides((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const buildPayload = () => ({
    title: title.trim(),
    mode,
    published,
    totalTimeLimitSeconds: mode === "NORMAL" && totalTimeLimitSeconds ? Number(totalTimeLimitSeconds) : null,
    slides: slides.map((slide) => {
      const base = {
        type: slide.type,
        question: slide.question.trim(),
        imageUrl: slide.imageUrl.trim(),
        timeLimitSeconds: mode === "TIME" ? Number(slide.timeLimitSeconds || 15) : null
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
      const payload = buildPayload();
      const response = await apiClient.post("/quizzes", payload);
      setSuccess(`Tạo quiz thành công: #${response.data.id} - ${response.data.title}`);
      setTitle("");
      setSlides([createEmptySlide()]);
      setPublished(true);
      setMode("NORMAL");
      setTotalTimeLimitSeconds("");
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 401 || status === 403) {
        setError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại rồi thử tạo quiz.");
      } else if (typeof message === "string" && message.trim()) {
        setError(message);
      } else if (typeof err?.response?.data === "string" && err.response.data.trim()) {
        setError(err.response.data);
      } else if (!err?.response) {
        setError("Không kết nối được backend. Hãy chạy backend rồi thử lại.");
      } else {
        setError("Tạo quiz thất bại. Kiểm tra dữ liệu slide.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-quiz">
      <div className="create-quiz-head">
        <h2 className="create-quiz-title">Create a Quiz</h2>
        <p className="create-quiz-subtitle">Tạo quiz theo kiểu slide, cảm hứng từ quiz.com editor.</p>
      </div>

      <form className="create-quiz-form" onSubmit={handleSubmit}>
        <label className="create-quiz-label">
          Quiz title
          <input
            className="create-quiz-input"
            type="text"
            placeholder="Ví dụ: Java OOP Challenge"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="create-quiz-switch">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publish ngay sau khi tạo
        </label>

        <label className="create-quiz-label">
          Quiz mode
          <select className="create-quiz-input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="NORMAL">Normal mode</option>
            <option value="TIME">Time mode</option>
          </select>
        </label>

        {mode === "NORMAL" && (
          <label className="create-quiz-label">
            Giới hạn tổng thời gian (giây, để trống nếu không giới hạn)
            <input
              className="create-quiz-input"
              type="number"
              min={10}
              value={totalTimeLimitSeconds}
              onChange={(e) => setTotalTimeLimitSeconds(e.target.value)}
            />
          </label>
        )}

        {slides.map((slide, index) => (
          <article className="slide-card" key={`slide-${index}`}>
            <div className="slide-card-top">
              <h3>Slide {index + 1}</h3>
              <button type="button" className="slide-remove" onClick={() => removeSlide(index)} disabled={slides.length <= 1}>
                Xóa slide
              </button>
            </div>

            <label className="create-quiz-label">
              Loại câu hỏi
              <select
                className="create-quiz-input"
                value={slide.type}
                onChange={(e) =>
                  updateSlide(index, {
                    type: e.target.value,
                    correctOptionIndexes: [0]
                  })
                }
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
                placeholder="Nhập nội dung câu hỏi"
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
                placeholder="https://..."
                value={slide.imageUrl}
                onChange={(e) => updateSlide(index, { imageUrl: e.target.value })}
              />
            </label>

            {mode === "TIME" && (
              <label className="create-quiz-label">
                Thời gian trả lời câu (10-30 giây)
                <input
                  className="create-quiz-input"
                  type="number"
                  min={10}
                  max={30}
                  value={slide.timeLimitSeconds}
                  onChange={(e) => updateSlide(index, { timeLimitSeconds: e.target.value })}
                  required
                />
              </label>
            )}

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
                      type="text"
                      placeholder={`Đáp án ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {slide.type === "ORDERING" && (
              <div className="slide-ordering">
                <p className="slide-note">Nhập các mục theo thứ tự đúng từ trên xuống dưới.</p>
                {slide.orderingItems.map((item, itemIndex) => (
                  <div className="slide-option-row" key={`order-${itemIndex}`}>
                    <span className="slide-order-index">{itemIndex + 1}</span>
                    <input
                      className="create-quiz-input"
                      type="text"
                      value={item}
                      onChange={(e) => updateOrderingItem(index, itemIndex, e.target.value)}
                      placeholder="Mục sắp xếp"
                    />
                    <button
                      type="button"
                      className="slide-inline-button"
                      onClick={() => removeOrderingItem(index, itemIndex)}
                      disabled={slide.orderingItems.length <= 2}
                    >
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
                  placeholder={"Ví dụ:\nJava\nJAVA"}
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
            {isSubmitting ? "Đang tạo..." : "Tạo Quiz"}
          </button>
        </div>

        {error && <p className="create-quiz-error">{error}</p>}
        {success && <p className="create-quiz-success">{success}</p>}
      </form>
    </section>
  );
}

export default CreateQuizPage;
