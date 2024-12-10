import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';
import dayData from './data.json'; // 로컬 JSON 파일에서 데이터 가져오기

const App = () => {
  const [data, setData] = useState<any[]>([]);
  const [wrongAnswersList, setWrongAnswersList] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'daySelection' | 'practice'>('menu');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [currentDay, setCurrentDay] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // 로컬 JSON 데이터를 사용하여 설정
      setData(dayData);
    } catch (error) {
      Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다.');
    }
  };

  const startDailyPractice = (day: string) => {
    const filteredData = data.filter(item => item.day.toLowerCase() === day.toLowerCase());
    if (filteredData.length > 0) {
      setCurrentQuestions(shuffleArray([...filteredData])); // 데이터 섞기
      setCurrentScreen('practice');
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setFeedbackMessage(null); // 이전 메시지 초기화
      setIsCorrectFeedback(null);
      setCurrentDay(day); // 현재 Day 설정
    } else {
      Alert.alert("데이터 없음", "선택한 날짜에 해당하는 데이터가 없습니다.");
    }
  };

  const startRandomPractice = () => {
    if (data.length > 0) {
      setCurrentQuestions(shuffleArray([...data])); // 데이터 섞기
      setCurrentScreen('practice');
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setFeedbackMessage(null); // 이전 메시지 초기화
      setIsCorrectFeedback(null);
      setCurrentDay(null); // 랜덤 연습이므로 Day 정보 없음
    } else {
      Alert.alert("데이터 없음", "현재 데이터가 없습니다.");
    }
  };

  const startWrongPractice = () => {
    if (wrongAnswersList.length > 0) {
      setCurrentQuestions(shuffleArray([...wrongAnswersList])); // 데이터 섞기
      setCurrentScreen('practice');
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setFeedbackMessage(null); // 이전 메시지 초기화
      setIsCorrectFeedback(null);
      setCurrentDay(null); // 오답 연습이므로 Day 정보 없음
    } else {
      Alert.alert("오답 없음", "현재 오답이 없습니다.");
    }
  };

  const handleAnswer = (isCorrect: boolean, question: any) => {
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
      setFeedbackMessage('정답입니다!');
      setIsCorrectFeedback(true);
      setWrongAnswersList(prevList => prevList.filter(item => item.word !== question.word));
    } else {
      setWrongAnswers(wrongAnswers + 1);
      setFeedbackMessage(`틀렸습니다. 정답은 '${question.meaning}' 입니다.`);
      setIsCorrectFeedback(false);
      setWrongAnswersList(prevList => {
        if (!prevList.some(item => item.word === question.word)) {
          return [...prevList, question];
        }
        return prevList;
      });
    }
    const remainingQuestions = currentQuestions.filter(item => item.word !== question.word);
    if (remainingQuestions.length > 0) {
      setCurrentQuestions(remainingQuestions);
    } else {
      Alert.alert("연습 완료", "모든 문제를 푸셨습니다!", [{ text: "메뉴로 돌아가기", onPress: () => resetToMenu() }]);
    }
  };

  const resetToMenu = () => {
    setCurrentScreen('menu');
    setFeedbackMessage(null);
    setIsCorrectFeedback(null);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setCurrentDay(null);
    setCurrentQuestions([]);
  };

  const renderMenu = () => (
    <View style={styles.menu}>
      <Text style={styles.title}>토익 단어 훈련</Text>
      <TouchableOpacity style={styles.button} onPress={() => setCurrentScreen('daySelection')}>
        <Text style={styles.buttonText}>날짜별 연습</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={startRandomPractice}>
        <Text style={styles.buttonText}>무작위 연습</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={startWrongPractice}>
        <Text style={styles.buttonText}>오답 연습</Text>
      </TouchableOpacity>
      <Text style={styles.authorInfo}>(만든이: Jeremy)</Text>
    </View>
  );

  const renderDaySelection = () => (
    <ScrollView style={styles.daySelection}>
      {Array.from({ length: 30 }, (_, index) => (
        <TouchableOpacity key={index} style={styles.dayButton} onPress={() => startDailyPractice(`day${index + 1}`)}>
          <Text style={styles.dayButtonText}>Day {index + 1}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.backButton} onPress={() => resetToMenu()}>
        <Text style={styles.backButtonText}>메뉴로 돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPractice = () => {
    if (currentQuestions.length === 0) return null;
    const currentQuestion = currentQuestions[0];
    const options = generateOptions(currentQuestion.meaning);

    return (
      <View style={styles.questionArea}>
        {currentDay && (
          <Text style={styles.currentDayText}>{currentDay.charAt(0).toUpperCase() + currentDay.slice(1)} 단어 문제 풀이</Text>
        )}
        {feedbackMessage && (
          <View style={[styles.feedbackBox, isCorrectFeedback ? styles.correctFeedbackBox : styles.wrongFeedbackBox]}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}
        <Text style={styles.statusText}>총 문제 수: {currentQuestions.length + correctAnswers + wrongAnswers}, 정답 수: {correctAnswers}, 틀린 수: {wrongAnswers}</Text>
        <Text style={styles.questionText}>다음 단어의 뜻은 무엇일까요?</Text>
        <Text style={styles.wordText}>{currentQuestion.word}</Text>
        {options.map((option, index) => (
          <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleAnswer(option === currentQuestion.meaning, currentQuestion)}>
            <Text style={[styles.optionButtonText, { fontSize: option.length > 20 ? 14 : 18 }]}>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backButton} onPress={() => resetToMenu()}>
          <Text style={styles.backButtonText}>메뉴로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const generateOptions = (correctAnswer: string) => {
    const options = new Set([correctAnswer]);
    while (options.size < 4) {
      const randomOption = data[Math.floor(Math.random() * data.length)].meaning;
      if (randomOption && randomOption !== correctAnswer) {
        options.add(randomOption);
      }
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  };

  const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'menu' && renderMenu()}
      {currentScreen === 'daySelection' && renderDaySelection()}
      {currentScreen === 'practice' && renderPractice()}
    </SafeAreaView>
  );
};

// 스타일 설정
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  menu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1e88e5',
    padding: 15,
    marginVertical: 10,
    width: '100%',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  authorInfo: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  daySelection: {
    flex: 1,
  },
  dayButton: {
    backgroundColor: '#1e88e5',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
  },
  dayButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#ff7043',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
  },
  currentDayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#1e88e5',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  optionButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  feedbackBox: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  correctFeedbackBox: {
    backgroundColor: '#00c853',
  },
  wrongFeedbackBox: {
    backgroundColor: '#ff1744',
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 20,
    textAlign: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default App;
