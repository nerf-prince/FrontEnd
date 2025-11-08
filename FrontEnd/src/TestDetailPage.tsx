import React from 'react';

interface ExerciseData {
  Sentence?: string;
  QuestionNumber?: number;
  Answer?: string;
  Options?: string;
  Code?: string;
  [key: string]: any;
}

interface SubjectData {
  _id?: { $oid: string };
  AnScolar: string;
  Sesiune: string;
  Sub1?: { [key: string]: ExerciseData };
  Sub2?: { [key: string]: ExerciseData };
  Sub3?: { [key: string]: ExerciseData };
  [key: string]: any;
}

interface TestDetailPageProps {
  subject: SubjectData;
  onNavigateBack: () => void;
}

const TestDetailPage: React.FC<TestDetailPageProps> = ({ subject, onNavigateBack }) => {

  const getExerciseLabel = (exerciseKey: string): string => {
    // Convert Ex1 -> Exercitiul 1, Ex2 -> Exercitiul 2, etc.
    const match = exerciseKey.match(/Ex(\d+)/);
    if (match) {
      return `Exercitiul ${match[1]}`;
    }
    return exerciseKey;
  };

  const renderExercise = (exerciseKey: string, exerciseData: ExerciseData) => {
    return (
      <div key={exerciseKey} className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-3 text-blue-600">
          {getExerciseLabel(exerciseKey)}
        </h3>

        {exerciseData.Sentence && (
          <div className="mb-3">
            <p className="text-gray-700">{exerciseData.Sentence}</p>
          </div>
        )}

        {exerciseData.Code && (
          <div className="mb-3">
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              <code>{exerciseData.Code}</code>
            </pre>
          </div>
        )}

        {exerciseData.Options && (
          <div className="mb-3">
            <p className="font-semibold mb-2">Opțiuni:</p>
            <ul className="list-disc list-inside">
              {exerciseData.Options.split('$').map((option, idx) => (
                <li key={idx} className="text-gray-700">
                  {String.fromCharCode(97 + idx)}) {option}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Render sub-questions (a, b, c, d, etc.) */}
        {Object.keys(exerciseData).map((key) => {
          if (key.match(/^[a-z]$/)) {
            const subQuestion = exerciseData[key] as any;
            return (
              <div key={key} className="ml-4 mb-2 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-gray-800">{key}) {subQuestion.Sentence}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderSubject = (subjectKey: string, subjectData: { [key: string]: ExerciseData }) => {
    const subjectNumber = subjectKey.replace('Sub', '');
    return (
      <div key={subjectKey} className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
          Subiectul {subjectNumber}
        </h2>
        <div className="space-y-4">
          {Object.keys(subjectData)
            .sort((a, b) => {
              // Sort Ex1, Ex2, Ex3 numerically
              const numA = parseInt(a.match(/\d+/)?.[0] || '0');
              const numB = parseInt(b.match(/\d+/)?.[0] || '0');
              return numA - numB;
            })
            .map((exerciseKey) => renderExercise(exerciseKey, subjectData[exerciseKey]))}
        </div>
      </div>
    );
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Testul nu a fost găsit</p>
          <button
            onClick={onNavigateBack}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Înapoi la listă
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={onNavigateBack}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
          >
            ← Înapoi
          </button>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Test Bacalaureat - Informatică
            </h1>
            <div className="flex gap-4 text-gray-600 mb-4">
              <span className="font-semibold">An școlar: {subject.AnScolar}</span>
              <span className="font-semibold">Sesiune: {subject.Sesiune}</span>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => {/* TODO: Implement start test logic */}}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 shadow-md"
              >
                Start Test
              </button>
              <button
                onClick={() => {/* TODO: Implement practice mode logic */}}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors duration-200 shadow-md"
              >
                Exersează pe test
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {subject.Sub1 && renderSubject('Sub1', subject.Sub1)}
          {subject.Sub2 && renderSubject('Sub2', subject.Sub2)}
          {subject.Sub3 && renderSubject('Sub3', subject.Sub3)}
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;

