import { useEffect, useState } from "react";
import "./App.css";
import { questions } from "./questions";

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function prepareGroups() {
  const group1 = shuffle(questions.filter((q) => q.question_id === 1));
  const group2 = shuffle(questions.filter((q) => q.question_id === 2));
  const group3 = shuffle(questions.filter((q) => q.question_id === 3));
  const group4 = shuffle(questions.filter((q) => q.question_id === 4));
  const group5 = shuffle(questions.filter((q) => q.question_id === 5));
  const group6 = shuffle(questions.filter((q) => q.question_id === 6));
  return { group1, group2, group3, group4, group5, group6 };
}

function buildRounds(groups, roundsCount) {
  const { group1, group2, group3, group4, group5, group6 } = groups;
  const rounds = [];
  // Минимальное количество полных кругов, которое можно составить из доступных вопросов
  const maxRounds = Math.min(
    Math.floor(group1.length / 5),
    Math.floor(group2.length / 3),
    Math.floor(group3.length / 5),
    Math.floor(group4.length / 5),
    Math.floor(group5.length / 5),
    Math.floor(group6.length / 5)
  );
  const actualRounds = Math.min(roundsCount, maxRounds);
  for (let r = 0; r < actualRounds; r++) {
    const round = [];
    for (let i = 0; i < 5; i++) round.push(group1[r * 5 + i]);
    for (let i = 0; i < 3; i++) round.push(group2[r * 3 + i]);
    for (let i = 0; i < 5; i++) round.push(group3[r * 5 + i]);
    for (let i = 0; i < 5; i++) round.push(group4[r * 5 + i]);
    for (let i = 0; i < 5; i++) round.push(group5[r * 5 + i]);
    for (let i = 0; i < 5; i++) round.push(group6[r * 5 + i]);
    rounds.push(round);
  }
  return rounds;
}

export default function App() {
  const [rounds, setRounds] = useState([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const groups = prepareGroups();
    const allRounds = buildRounds(groups, 100);
    setRounds(allRounds);
    if (allRounds.length === 0) {
      setFinished(true);
    } else {
      setTotalQuestions(allRounds.length * 28); // 5+3+5+5+5+5 = 28
    }
  }, []);

  if (rounds.length === 0 && !finished) return <div className="app">Загрузка...</div>;
  if (finished) {
    const wrong = totalQuestions - totalScore;
    return (
      <div className="app">
        <div className="question" style={{ flexDirection: "column", gap: "15px" }}>
          <span>Тест завершён!</span>
          <span>Правильных ответов: {totalScore}</span>
          <span>Неправильных ответов: {wrong}</span>
          <span>Всего вопросов: {totalQuestions}</span>
          <button onClick={() => window.location.reload()} className="new-quiz-button">
            Начать новый тест
          </button>
        </div>
      </div>
    );
  }

  const currentRound = rounds[currentRoundIdx];
  const question = currentRound[currentQIndex];
  const hasExplanation = question.explanation && question.explanation.length > 0;
  const questionsInRound = currentRound.length;
  const hasImage = question.imageUrl && question.imageUrl.trim() !== "";

  function handleAnswer(index) {
    if (selected !== null) return;
    setSelected(index);
    const isCorrect = index === question.correct;
    if (isCorrect) {
      setRoundScore(roundScore + 1);
      setTotalScore(totalScore + 1);
    }

    if (hasExplanation) {
      setTimeout(() => {
        setModalOpen(true);
      }, 300);
    } else {
      setTimeout(() => {
        setSelected(null);
        if (currentQIndex + 1 < questionsInRound) {
          setCurrentQIndex(currentQIndex + 1);
        } else {
          setRoundModalOpen(true);
        }
      }, 1000);
    }
  }

  function closeModalAndNext() {
    setModalOpen(false);
    setSelected(null);
    if (currentQIndex + 1 < questionsInRound) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setRoundModalOpen(true);
    }
  }

  function closeRoundModal() {
    setRoundModalOpen(false);
    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx(currentRoundIdx + 1);
      setCurrentQIndex(0);
      setRoundScore(0);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  if (roundModalOpen) {
    const wrongInRound = questionsInRound - roundScore;
    return (
      <div className="modal-overlay" onClick={closeRoundModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-explanation">
            Круг {currentRoundIdx + 1} из {rounds.length} завершён!
            <br /><br />
            Правильных ответов: {roundScore}
            <br />
            Неправильных ответов: {wrongInRound}
            <br />
            Всего в круге: {questionsInRound}
          </div>
          <button className="modal-next" onClick={closeRoundModal}>
            Следующий круг
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="question">
        {hasImage && (
          <img src={question.imageUrl} alt="Иллюстрация к вопросу" className="question-image" />
        )}
        <div className="question-text">{question.question}</div>
      </div>

      <div className="answers">
        {question.answers.map((answer, index) => {
          let className = "answer";
          if (selected !== null) {
            if (index === question.correct) {
              className += " correct";
            } else if (index === selected && index !== question.correct) {
              className += " wrong";
            }
          }
          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
              disabled={selected !== null}
            >
              {answer}
            </button>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModalAndNext}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-explanation">{question.explanation}</div>
            <button className="modal-next" onClick={closeModalAndNext}>
              Далее
            </button>
          </div>
        </div>
      )}
    </div>
  );
}