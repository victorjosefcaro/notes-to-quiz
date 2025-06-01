import { useState, useEffect } from 'react'
import QuestionCard from './components/QuestionCard'
import DonutChart from './components/DonutChart'
import { generateQuestions } from './services/quizService'

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const exampleQuestions = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    },
    {
      question: "What is the largest mammal in the world?",
      options: ["African Elephant", "Blue Whale", "Giraffe", "White Rhinoceros"],
      correctAnswer: 1
    }
  ];

  const handleAnswerSubmit = (questionIndex, isCorrect, selectedAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: { isCorrect, selectedAnswer },
    }));
    setAnsweredCount(Object.keys(answers).length + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!notes.trim()) {
      setError('Please enter some notes first.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgress(0);
    setAnsweredCount(0);
    setCorrectCount(0);

    try {
      const generatedQuestions = await generateQuestions(notes, (progress) => {
        setProgress(progress);
      });
      setQuestions(generatedQuestions);
      setShowQuiz(true);
    } catch (err) {
      setError('There was an issue generating questions. Please try with shorter notes or try again in a moment.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSampleQuiz = () => {
    setQuestions(exampleQuestions);
    setShowQuiz(true);
    setAnsweredCount(0);
    setCorrectCount(0);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-8">
        {showQuiz ? (
          <div className="w-full mx-auto px-4 md:px-16 lg:px-32">
            <div className="bg-white rounded-lg p-4 shadow sticky top-8 mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-teal-700 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Progress: {answeredCount} of {questions.length} questions answered
              </p>
            </div>

            <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 space-y-6">
                <QuestionCard
                  key={currentQuestionIndex}
                  questionNumber={currentQuestionIndex + 1}
                  question={questions[currentQuestionIndex].question}
                  options={questions[currentQuestionIndex].options}
                  correctAnswer={questions[currentQuestionIndex].correctAnswer}
                  onAnswerSubmit={(isCorrect, selectedAnswer) => handleAnswerSubmit(currentQuestionIndex, isCorrect, selectedAnswer)}
                  isAnswered={answers.hasOwnProperty(currentQuestionIndex)}
                  selectedAnswer={answers[currentQuestionIndex]?.selectedAnswer}
                />

                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentQuestionIndex === 0}
                    className={`py-2 px-4 rounded-lg transition ${currentQuestionIndex === 0 ? 'bg-gray-300 text-gray-500' : 'bg-teal-700 text-white hover:bg-teal-600'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`py-2 px-4 rounded-lg transition ${currentQuestionIndex === questions.length - 1 ? 'bg-gray-300 text-gray-500' : 'bg-teal-700 text-white hover:bg-teal-600'}`}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="w-72 shrink-0 sticky top-32">
                <div className="bg-white rounded-lg p-6 shadow mb-6 lg:mb-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quiz Results</h3>
                  <DonutChart
                    correctAnswers={correctCount}
                    totalQuestions={questions.length}
                  />
                  <button
                    onClick={() => {
                      setShowQuiz(false);
                      setQuestions([]);
                      setAnswers({});
                      setAnsweredCount(0);
                      setCorrectCount(0);
                      setCurrentQuestionIndex(0);
                      setNotes('');
                    }}
                    className="text-teal-700 hover:text-teal-600 mt-4 w-full"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isLoading ? (
          <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-lg shadow-lg max-w-xl w-full m-4">
            <h1 className="text-2xl font-semibold text-gray-800 text-center">
              Enter your study notes to generate a quiz based on the topic
            </h1>
            {error && (
              <div className="w-full p-4 text-red-700 bg-red-100 rounded-lg mb-4">
                {error}
              </div>
            )}
            <textarea
              rows="10"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block p-4 w-full border border-teal-700 rounded-lg outline-teal-700"
              placeholder="Enter your notes here..."
            />
            <div className="flex gap-4">
              <button
                onClick={handleGenerateQuiz}
                className="bg-teal-700 hover:bg-teal-600 text-white py-2 px-8 rounded-lg transition"
              >
                Generate Quiz
              </button>
              <button
                onClick={handleUseSampleQuiz}
                className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-8 rounded-lg transition"
              >
                Try Sample Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-lg shadow-lg max-w-md w-full m-10">
            <div className="flex items-center justify-center w-20 h-20 bg-teal-50 rounded-full">
              <svg className="animate-spin h-10 w-10 text-teal-700" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Analyzing Your Notes</h2>
            <p className="text-gray-600">Using AI to generate your quiz...</p>
          </div>
        )}
      </div>
    </>
  )
}

export default App
