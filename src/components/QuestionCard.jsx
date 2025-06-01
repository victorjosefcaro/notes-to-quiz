function QuestionCard({ question, options, correctAnswer, questionNumber, onAnswerSubmit, isAnswered, selectedAnswer }) {
  const handleAnswerSelect = (index) => {
    if (!isAnswered) {
      onAnswerSubmit(index === correctAnswer, index);
    }
  };

  const getOptionclassName = (index) => {
    if (!isAnswered) return 'hover:bg-gray-100';
    if (index === correctAnswer) return 'bg-green-100 border-green-500';
    if (index === selectedAnswer) return 'bg-red-100 border-red-500';
    return 'opacity-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">
          Question {questionNumber}
        </span>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {question}
      </h3>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg border border-gray-500 transition-all
              ${isAnswered ? '' : 'cursor-pointer'} 
              ${getOptionclassName(index)}`}
          >
            <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionCard;
