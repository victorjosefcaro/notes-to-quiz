import OpenAI from "openai";

const token = import.meta.env.VITE_GITHUB_TOKEN;
const model = import.meta.env.VITE_GITHUB_MODEL;

const client = new OpenAI({
  apiKey: token,
  dangerouslyAllowBrowser: true,
  baseURL: "https://models.github.ai/inference",
  defaultHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function callGitHubAPI(messages) {
  try {
    const response = await client.chat.completions.create({
      messages: messages,
      model: model,
      temperature: 0.7,
      top_p: 1.0
    });

    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export const generateQuestions = async (notes, onProgress = () => { }) => {
  try {
    onProgress(10);

    const messages = [
      {
        role: "system",
        content: `You are a quiz generator that creates multiple choice questions. Generate at least 5 multiple choice questions based on these notes. You MUST follow these rules:

1.  Generate a minimum of 5 different questions.
2.  Each question MUST start with a number followed by a period and a space (e.g., "1. ", "2. ").
3.  The question text must be on its own line(s).
4.  Each question must have EXACTLY 4 options (A, B, C, D).
5.  Each option MUST start on a new line with its letter, a parenthesis, and a space (e.g., "A) ", "B) ").
6.  Each option must be a complete, non-empty answer.
7.  Mark exactly ONE correct answer by appending an asterisk (*) to the end of the correct option's text. For example: C) Correct Answer*
8.  Do not use asterisks anywhere else in the entire response.
9.  Ensure there is a newline character after the question text and before the first option (A).
10. Ensure each option is on a distinct new line.

Follow this exact format structure for each question:
[Question Number]. [Write your complete question here]
A) [Complete option text]
B) [Complete option text]
C) [Complete option text]*
D) [Complete option text]

Example of two questions:
1. What is the primary benefit of using version control?
A) It makes code harder to read
B) It allows multiple people to work on the same codebase simultaneously*
C) It automatically fixes bugs
D) It is only useful for solo developers

2. Which of the following is a common JavaScript framework?
A) Python
B) HTML
C) React*
D) SQL
`
      },
      {
        role: "user",
        content: `Notes to generate questions from: ${notes}`
      }
    ];

    onProgress(30);
    const response = await callGitHubAPI(messages);
    onProgress(70);

    const rawText = response.choices[0].message.content;
    console.log('--- Raw API Response from GitHub AI ---');
    console.log(rawText);
    console.log('--- End of Raw API Response ---');

    const questions = [];
    const questionBlocks = rawText
      .split(/\n(?=\d+\.\s)/)
      .map(block => block.trim())
      .filter(block => block.length > 0);

    console.log(`Found ${questionBlocks.length} potential question blocks.`);
    if (questionBlocks.length === 0 && rawText.trim().length > 0) {
      console.warn("No numbered question blocks found. The AI might not have followed the numbering format. Attempting to process as a single block if it contains options.");
      if (rawText.includes("A)") && rawText.includes("B)")) {
        questionBlocks.push(rawText.trim());
      }
    }


    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      console.log(`\n--- Processing Block ${i + 1} ---`);
      console.log(block);
      console.log(`--- End of Block ${i + 1} ---`);

      try {
        const questionMatch = block.match(/^(\d+\.\s*)([\s\S]+?)\n\s*A\)/s);
        if (!questionMatch || !questionMatch[2]) {
          console.warn(`Block ${i + 1}: Could not extract question text or leading 'A)' option not found directly after question.`);
          continue;
        }
        const questionText = questionMatch[2].trim();
        if (!questionText) {
          console.warn(`Block ${i + 1}: Extracted question text is empty.`);
          continue;
        }
        console.log(`Block ${i + 1}: Extracted Question - "${questionText}"`);

        const optionsBlockMatch = block.match(/\n\s*(A\)\s[\s\S]*)/s);
        if (!optionsBlockMatch || !optionsBlockMatch[1]) {
          console.warn(`Block ${i + 1}: Could not find the start of the options block (starting with A)).`);
          continue;
        }
        const optionsText = optionsBlockMatch[1];

        const parsedOptions = [];
        const optionLabels = ['A', 'B', 'C', 'D'];
        let currentOptionText = optionsText;

        for (let j = 0; j < optionLabels.length; j++) {
          const currentLabel = optionLabels[j];
          const nextLabel = (j < optionLabels.length - 1) ? optionLabels[j + 1] : null;

          let optionRegex;
          if (nextLabel) {
            optionRegex = new RegExp(`^${currentLabel}\\)\\s*([\\s\\S]*?)(?=\\n\\s*${nextLabel}\\)|$)`, "s");
          } else {
            optionRegex = new RegExp(`^${currentLabel}\\)\\s*([\\s\\S]*)$`, "s");
          }

          const match = currentOptionText.match(optionRegex);
          if (match && match[1] !== undefined) {
            const extractedText = match[1].trim();
            parsedOptions.push(extractedText);
            const matchedLength = match[0].length;
            currentOptionText = currentOptionText.substring(matchedLength).trim();
          } else {
            console.warn(`Block ${i + 1}: Could not parse option ${currentLabel}. Remaining text:`, currentOptionText);
            break;
          }
        }

        if (parsedOptions.length !== 4) {
          console.warn(`Block ${i + 1}: Expected 4 options, but parsed ${parsedOptions.length}. Options found:`, parsedOptions);
          continue;
        }
        console.log(`Block ${i + 1}: Parsed Options (raw) -`, parsedOptions);

        if (parsedOptions.some(opt => opt === "")) {
          console.warn(`Block ${i + 1}: One or more options are empty after trimming. Options:`, parsedOptions);
          continue;
        }

        const correctIndex = parsedOptions.findIndex(opt => opt.endsWith('*'));
        if (correctIndex === -1) {
          console.warn(`Block ${i + 1}: No correct answer asterisk (*) found at the end of an option. Options:`, parsedOptions);
          continue;
        }

        const cleanOptions = parsedOptions.map(opt => opt.replace(/\*$/, '').trim());

        if (cleanOptions.some(opt => opt.includes('*'))) {
          console.warn(`Block ${i + 1}: Asterisk found in an unexpected place after initial cleaning. Cleaned Options:`, cleanOptions);
          continue;
        }
        if (cleanOptions.some(opt => opt === "")) {
          console.warn(`Block ${i + 1}: One or more options became empty after cleaning asterisk. Cleaned Options:`, cleanOptions);
          continue;
        }

        questions.push({
          question: questionText,
          options: cleanOptions,
          correctAnswer: correctIndex
        });
        console.log(`Block ${i + 1}: Successfully parsed question!`, { question: questionText, options: cleanOptions, correctAnswer: correctIndex });

      } catch (e) {
        console.warn(`Block ${i + 1}: An unexpected error occurred during parsing. Error:`, e, `Block content:`, block);
      }
    }

    if (questions.length === 0) {
      console.error('Final "questions" array is empty. No valid questions were parsed from the AI response. Check previous logs for details on why blocks were skipped.');
      throw new Error('Failed to generate valid questions. The AI response could not be parsed into the expected quiz format. Please try again or check the console for detailed parsing logs.');
    }

    onProgress(100);
    return questions;
  } catch (error) {
    console.error('Error in generateQuestions function:', error);
    if (error.message && error.message.startsWith('Failed to generate valid questions')) {
      throw error;
    }
    throw new Error(`Failed to generate questions: ${error.message || 'An unknown error occurred.'}`);
  }
};
