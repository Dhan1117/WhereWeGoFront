import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SurveyPage.module.scss'; // 경로 수정: pages/SurveyPage.module.scss

// 기존의 loadingMessages, facts, majorCities, surveyAttractions, startingPoints 데이터는 그대로 둡니다.
const loadingMessages = [
  "부산 여행 선호도를 분석하고 있습니다...",
  "부산의 명소들을 검색하고 있습니다...",
  "당신에게 가장 적합한 부산 여행지를 찾고 있습니다...",
  "맞춤형 부산 여행 추천을 생성하고 있습니다...",
  "거의 완료되었습니다. 조금만 더 기다려주세요..."
];

const facts = [
  "해운대 해수욕장은 부산에서 가장 유명한 해변으로, 연간 약 1천만 명이 방문합니다.",
  "감천문화마을은 색색의 집들이 산비탈에 늘어선 예술 마을로, '한국의 마추픽추'라 불립니다.",
  "부산 국제영화제는 아시아에서 가장 큰 영화제 중 하나로, 매년 10월에 개최됩니다.",
  "태종대는 부산의 남동쪽 끝에 위치한 해안 절벽으로, 수려한 자연 경관을 자랑합니다.",
  "광안대교는 밤에 화려한 조명으로 빛나는 부산의 랜드마크입니다.",
  "자갈치 시장은 한국 최대의 수산물 시장으로, 신선한 해산물을 맛볼 수 있습니다."
];

const majorCities = [
  "서울", "인천", "대전", "대구", "광주", "울산", "제주"
];

const surveyAttractions = [
  {
    id: 1,
    name: "해운대",
    description: "넓은 백사장과 푸른 바다가 아름다운 부산의 대표 해수욕장",
    category: "해변",
    lat: 35.1587,
    lng: 129.1606,
    duration: 3
  },
  {
    id: 2,
    name: '광안리',
    description: "광안대교 야경과 트렌디한 카페, 맛집이 어우러진 활기찬 해변",
    category: "해변",
    lat: 35.1532,
    lng: 129.1197,
    duration: 2
  },
  {
    id: 3,
    name: '감천문화마을',
    description: "형형색색의 집들이 계단식으로 늘어선 아름다운 문화 예술 마을",
    category: "문화",
    lat: 35.0979,
    lng: 129.0108,
    duration: 2
  },
  {
    id: 4,
    name: '태종대',
    description: "기암절벽과 푸른 바다가 어우러진 부산의 아름다운 자연 공원",
    category: "자연",
    lat: 35.0518,
    lng: 129.0873,
    duration: 3
  },
  {
    id: 5,
    name: '부산역',
    description: "부산의 관문이자 교통의 중심지",
    category: "교통",
    lat: 35.1156,
    lng: 129.0423,
    duration: 0.5
  },
  {
    id: 6,
    name: '남포동',
    description: "부산의 대표적인 번화가이자 쇼핑 중심지",
    category: "쇼핑",
    lat: 35.0969,
    lng: 129.0286,
    duration: 2
  },
  {
    id: 7,
    name: '자갈치시장',
    description: "한국 최대의 수산물 시장으로 신선한 해산물을 맛볼 수 있는 곳",
    category: "음식",
    lat: 35.0969,
    lng: 129.0308,
    duration: 1.5
  },
  {
    id: 8,
    name: '용두산공원',
    description: "부산 시내를 한눈에 내려다볼 수 있는 전망 명소",
    category: "자연",
    lat: 35.1008,
    lng: 129.0324,
    duration: 1
  }
];

const startingPoints = [
  { id: '6870f39e748cc28771f1b2a7', name: '부산역' },
  { id: '6870f39e748cc28771f1b2a8', name: '김해국제공항' },
  { id: '6870f39e748cc28771f1b2a3', name: '부산서부시외버스터미널' },
  { id: '6870f39e748cc28771f1b2a5', name: '사상시외버스터미널' },
  { id: '6870f39e748cc28771f1b2a6', name: '부산종합버스터미널' },
  { id: '6870f39e748cc28771f1b2a4', name: '부산항 국제여객터미널' }
];

export default function SurveyPage() { // 컴포넌트 이름도 SurveyPage로 변경 권장
  const navigate = useNavigate();

  const [stage, setStage] = useState('start');
  const [preferences, setPreferences] = useState({});
  const [currentAttractionIndex, setCurrentAttractionIndex] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [departureCity, setDepartureCity] = useState('서울');
  const [otherCity, setOtherCity] = useState('');
  const [travelDuration, setTravelDuration] = useState(2);
  const [travelStartDate, setTravelStartDate] = useState('');
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);
  const [startingPoint, setStartingPoint] = useState(startingPoints[0].id);

  const totalAttractions = surveyAttractions.filter(a => a.category !== '교통').length;
  const completedCount = Object.keys(preferences).length;

  useEffect(() => {
    if (stage === 'loading') {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      const factInterval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
      }, 4000);
      
      const progressInterval = setInterval(() => {
        // API 호출 중에는 95%까지만 진행되도록 하여 실제 완료와 구분
        setLoadingProgress((prev) => Math.min(prev + 5, 95));
      }, 500);

      // setTimeout과 navigate 로직이 제거됨
      return () => {
        clearInterval(messageInterval);
        clearInterval(factInterval);
        clearInterval(progressInterval);
      };
    }
}, [stage]);


  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setTravelStartDate(formattedDate);
  }, []);

  const handlePreference = (preference) => {
    const currentAttraction = surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex];
    // 'like'일 경우에만 true, 나머지는 false 또는 선호도 객체에서 제외할 수 있습니다.
    // 여기서는 'like'만 true로 기록합니다.
    setPreferences(prev => ({ ...prev, [String(currentAttraction.id)]: preference === 'like' }));

    if (currentAttractionIndex < totalAttractions - 1) {
      setCurrentAttractionIndex(prevIndex => prevIndex + 1);
    } else {
      setStage('additionalInfo');
    }
};


  const handleStartSurvey = () => {
    setStage('survey');
    setCurrentAttractionIndex(0);
    setPreferences({});
  };

  const handleRestartSurvey = () => {
    setStage('start');
    setCurrentAttractionIndex(0);
    setPreferences({});
    setDepartureCity('서울');
    setOtherCity('');
    setTravelDuration(2);

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setTravelStartDate(formattedDate);

    setShowOtherCityInput(false);
    setStartingPoint('busan-station');
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setDepartureCity(selectedCity);
    setShowOtherCityInput(selectedCity === '기타');
  };

  const currentAttraction = stage === 'survey'
    ? surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex]
    : null;

const handleSubmitAdditionalInfo = async () => {
    setStage('loading');
    setLoadingProgress(0); // 로딩 애니메이션 시작

    // 백엔드의 ItineraryRequest 스키마에 맞게 요청 데이터 구성
    const requestBody = {
      departureCity: departureCity,
      otherCity: otherCity,
      travelDuration: travelDuration,
      travelStartDate: travelStartDate,
      startingPoint: startingPoint,
      preferences: preferences,
      surveyAttractions: surveyAttractions.map(attr => String(attr.id))
    };

    try {
      // ❗️ 수정된 최종 API 경로
      // 백엔드 main.py의 prefix="/api/v1"와 라우터의 "/generate"가 조합된 경로입니다.
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // API 응답이 정상이 아닐 경우, 에러 메시지를 포함하여 예외 처리
      if (!response.ok) {
        // 응답을 텍스트로 먼저 받아서 JSON인지 확인 (HTML 오류 방지)
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || '알 수 없는 서버 오류가 발생했습니다.');
        } catch (e) {
            // JSON 파싱 실패 시, HTML 오류 페이지 내용 등을 표시
            throw new Error(`서버로부터 잘못된 형식의 응답을 받았습니다. (상태 코드: ${response.status})`);
        }
      }

      const itineraryData = await response.json();

      // 성공 시 결과 페이지로 데이터와 함께 이동
      navigate('/busan-travel-plan', {
        state: {
          itinerary: itineraryData,
          departureCity: departureCity === '기타' ? otherCity : departureCity,
          travelDuration,
          travelStartDate
        }
      });

    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert(`${error.message}`);
      setStage('additionalInfo'); // 오류 발생 시 추가 정보 입력 화면으로 복귀
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {stage === 'start' && (
          <div className={styles.startScreen}>
            <h1 className={styles.startTitle}>부산 여행 스타일 찾기</h1>
            <p className={styles.startButtonText}>부산의 관광 명소에 대한 몇 가지 질문에 답하고 맞춤형 여행 코스를 받아보세요.</p>
            <button
              onClick={handleStartSurvey}
              className={styles.startButton}
            >
              설문 시작하기
            </button>
          </div>
        )}

        {stage === 'loading' && (
          <div className={styles.loadingScreen}>
            <h2 className={styles.loadingTitle}>분석 중...</h2>

            <div className={styles.loadingProgressContainer}>
              <div
                className={styles.loadingProgressBar}
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            <p className={styles.loadingMessage}>
              {loadingMessages[loadingMessageIndex]}
            </p>

            <div className={styles.factBox}>
              <h3 className={styles.factTitle}>알고 계셨나요?</h3>
              <p className={styles.factText}>{facts[factIndex]}</p>
            </div>
          </div>
        )}

        {stage === 'additionalInfo' && (
          <div className={styles.resultsScreen}>
            <h2 className={styles.resultsTitle}>추가 정보 입력</h2>
            <p className="text-center text-gray-600 mb-8">맞춤형 여행 코스를 위해 몇 가지 정보가 더 필요합니다.</p>

            <div className="space-y-6 max-w-2xl mx-auto">
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>출발 도시</label>
                <select
                  className={styles.infoSelect}
                  value={departureCity}
                  onChange={handleCityChange}
                >
                  {majorCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  <option value="기타">기타</option>
                </select>
              </div>

              {showOtherCityInput && (
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>출발 도시명 입력</label>
                  <input
                    type="text"
                    className={styles.infoInput}
                    value={otherCity}
                    onChange={(e) => setOtherCity(e.target.value)}
                    placeholder="도시명을 입력하세요"
                  />
                </div>
              )}

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>부산 내 출발지</label>
                <select
                  className={styles.infoSelect}
                  value={startingPoint}
                  onChange={(e) => setStartingPoint(e.target.value)}
                >
                  {startingPoints.map(point => (
                    <option key={point.id} value={point.id}>{point.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>여행 시작일</label>
                <input
                  type="date"
                  className={styles.infoInput}
                  value={travelStartDate}
                  onChange={(e) => setTravelStartDate(e.target.value)}
                />
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>여행 기간 (일)</label>
                <div className={styles.durationControl}>
                  <button
                    type="button"
                    className={styles.durationButton}
                    onClick={() => setTravelDuration(prev => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <span className={styles.durationValue}>{travelDuration}</span>
                  <button
                    type="button"
                    className={styles.durationButton}
                    onClick={() => setTravelDuration(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <button
                  type="button"
                  onClick={handleSubmitAdditionalInfo}
                  className={styles.startButton}
                >
                  여행 코스 생성하기
                </button>
                <button
                  type="button"
                  onClick={handleRestartSurvey}
                  className={styles.restartButton}
                >
                  설문 다시 하기
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'survey' && (
          <div className={styles.surveyScreen}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(completedCount / totalAttractions) * 100}%` }}
              ></div>
            </div>

            <div className={styles.questionCounter}>
              {currentAttractionIndex + 1} / {totalAttractions}
            </div>

            {currentAttraction && (
              <div className={styles.attractionCard}>
                <img src={`/image/${currentAttraction.id}.jpg`} alt={currentAttraction.name} className={styles.attractionImage} />
                <div className={styles.attractionOverlay}>
                  <h2 className={styles.attractionName}>{currentAttraction.name}</h2>
                  <p className={styles.attractionDescription}>{currentAttraction.description}</p>
                </div>
              </div>
            )}

            <div className={styles.preferenceButtons}>
              <button
                onClick={() => handlePreference('like')}
                className={`${styles.preferenceButton} ${styles.likeButton}`}
              >
                <span className={styles.buttonIcon}>👍</span>
                <span className={styles.buttonText}>좋아요</span>
              </button>

              <button
                onClick={() => handlePreference('neutral')}
                className={`${styles.preferenceButton} ${styles.neutralButton}`}
              >
                <span className={styles.buttonIcon}>🤔</span>
                <span className={styles.buttonText}>모르겠어요</span>
              </button>

              <button
                onClick={() => handlePreference('dislike')}
                className={`${styles.preferenceButton} ${styles.dislikeButton}`}
              >
                <span className={styles.buttonIcon}>👎</span>
                <span className={styles.buttonText}>싫어요</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}