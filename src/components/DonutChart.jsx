const DonutChart = ({ correctAnswers, totalQuestions }) => {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100) || 0;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center mt-6">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="#14b8a6"
            strokeWidth="12"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700">{percentage}%</span>
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">
        Correct Answers: {correctAnswers} / {totalQuestions}
      </p>
    </div>
  );
};

export default DonutChart;
