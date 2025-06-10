import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SurveyPage.module.scss';
import axios from 'axios'; // axios 임포트

// --- 수정된 apiClient 설정 ---
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_PREFIX, // 'baseURL'로 속성명 정확히 설정
  withCredentials: true, // 세션 쿠키를 포함하여 요청 (로그인 상태 유지를 위함)
});
// --- apiClient 설정 끝 ---


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

// SurveyPage에서 사용할 관광지 데이터 (Place 모델에 맞게 정의)
const surveyAttractions = [
  {
    id: 1, // place_id로 사용될 수 있음
    name: "해운대",
    description: "넓은 백사장과 푸른 바다가 아름다운 부산의 대표 해수욕장",
    category: "해변",
    lat: 35.1587,
    lng: 129.1606,
    duration: 3 // 체류 시간 (시간 단위)
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

// 시작점 데이터 (Place 모델의 origin/dest에 사용될 수 있음)
const startingPoints = [
  { id: 'busan-station', name: '부산역', lat: 35.1156, lng: 129.0423 },
  { id: 'gimhae-airport', name: '김해공항', lat: 35.1796, lng: 128.9384 },
  { id: 'haeundae', name: '해운대', lat: 35.1587, lng: 129.1606 },
  { id: 'seomyeon', name: '서면', lat: 35.1575, lng: 129.0594 },
  { id: 'nampo', name: '남포동', lat: 35.0969, lng: 129.0286 }
];


export default function SurveyPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState('start'); // 'start', 'survey', 'additionalInfo', 'loading'
  const [preferences, setPreferences] = useState({}); // { attractionId: 'like' | 'neutral' | 'dislike' }
  const [currentAttractionIndex, setCurrentAttractionIndex] = useState(0);

  // 로딩 화면 관련 상태
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 추가 정보 입력 관련 상태
  const [departureCity, setDepartureCity] = useState('서울');
  const [otherCity, setOtherCity] = useState('');
  const [travelDuration, setTravelDuration] = useState(2); // 여행 기간 (일)
  const [travelStartDate, setTravelStartDate] = useState(''); // 여행 시작일 (YYYY-MM-DD)
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);
  const [startingPoint, setStartingPoint] = useState('busan-station'); // 부산 내 출발지

  // 백엔드로부터 받은 코스 데이터를 저장할 상태
  const [generatedCourse, setGeneratedCourse] = useState(null);

  // 설문 진행률 계산을 위한 상태
  const totalAttractions = surveyAttractions.filter(a => a.category !== '교통').length;
  const completedCount = Object.keys(preferences).length;

  // 로딩 화면 UI 업데이트 로직
  useEffect(() => {
    if (stage === 'loading') {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      const factInterval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
      }, 4000);

      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress <= 100 ? newProgress : 100;
        });
      }, 500);

      // generateTravelCourse 함수는 handleSubmitAdditionalInfo에서 직접 호출되므로,
      // 여기서는 로딩 UI 관련 인터벌만 관리합니다.
      // API 응답 후 navigate가 호출되도록 변경되었으므로, 여기서는 timeout 로직 제거.

      return () => {
        clearInterval(messageInterval);
        clearInterval(factInterval);
        clearInterval(progressInterval);
      };
    }
  }, [stage]);

  // 컴포넌트 마운트 시 오늘 날짜로 여행 시작일 초기화
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    setTravelStartDate(formattedDate);
  }, []);

  // 설문 응답 처리
  const handlePreference = (preference) => {
    const currentAttraction = surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex];
    setPreferences(prev => ({ ...prev, [currentAttraction.id]: preference }));

    if (currentAttractionIndex < totalAttractions - 1) {
      setCurrentAttractionIndex(prevIndex => prevIndex + 1);
    } else {
      setStage('additionalInfo'); // 모든 설문 완료 후 추가 정보 입력 단계로
    }
  };

  // 설문 시작 버튼 클릭 시
  const handleStartSurvey = () => {
    setStage('survey');
    setCurrentAttractionIndex(0);
    setPreferences({});
  };

  // 설문 다시 하기 버튼 클릭 시 모든 상태 초기화
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
    setGeneratedCourse(null); // 코스 초기화
  };

  // 출발 도시 변경 처리
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setDepartureCity(selectedCity);
    setShowOtherCityInput(selectedCity === '기타');
  };

  // 현재 설문 중인 관광지 정보
  const currentAttraction = stage === 'survey'
    ? surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex]
    : null;


  // --- 수정된 generateTravelCourse 함수 ---
  // 백엔드 라우터를 호출하여 여행 코스를 생성하는 함수
  const generateTravelCourse = async () => {
    setLoadingProgress(0); // 로딩 시작 시 진행률 초기화
    try {
      // 사용자가 선호하는 장소들만 필터링 (좋아요, 모르겠어요)
      const preferredAttractions = surveyAttractions.filter(attraction =>
        preferences[attraction.id] === 'like' || preferences[attraction.id] === 'neutral'
      );

      // 출발지와 목적지 찾기
      const originPoint = startingPoints.find(p => p.id === startingPoint);
      const defaultDest = startingPoints.find(p => p.id === 'busan-station'); // 일단 부산역을 최종 목적지로 가정

      if (!originPoint) {
        console.error("선택된 출발지를 찾을 수 없습니다.");
        alert("여행 코스 생성을 위한 출발지 정보가 부족합니다.");
        setStage('additionalInfo');
        return;
      }
      if (!defaultDest) {
        console.error("기본 목적지 정보를 찾을 수 없습니다.");
        alert("여행 코스 생성을 위한 목적지 정보가 부족합니다.");
        setStage('additionalInfo');
        return;
      }

      // 날짜 형식 백엔드 BaseModel 정의에 따라 'YYYY-MM-DDTHH:MM:SS'로 조정
      // travelStartDate: "YYYY-MM-DD" 형식 (input type="date"에서 얻음)
      const startDate = new Date(travelStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + travelDuration); // 여행 기간만큼 일수 더함

      const startDtFormatted = `${travelStartDate}T09:00:00`; // 시작 시간 임의로 09:00:00 설정
      const endDtFormatted = `${endDate.toISOString().split('T')[0]}T18:00:00`; // 종료일의 시간 임의로 18:00:00 설정

      // 백엔드 MultiDayCourseRequest 모델에 맞게 데이터 가공
      // 백엔드 Place 모델: place_id: str, coords: Tuple[float, float], rec_score: Optional[float]
      const payload = {
        candidates: preferredAttractions.map(att => ({
          place_id: String(att.id), // 'id'를 'place_id'로 매핑하고 문자열로 변환
          coords: [att.lat, att.lng], // 'lat'과 'lng'를 'coords' 튜플(배열)로 변환
          rec_score: 0.5 // 예시 값. 필요에 따라 동적으로 설정 가능.
        })),
        origin: {
          place_id: String(originPoint.id),
          coords: [originPoint.lat, originPoint.lng],
          rec_score: 1.0 // 출발지는 추천 점수 높게 설정 (예시)
        },
        dest: {
          place_id: String(defaultDest.id),
          coords: [defaultDest.lat, defaultDest.lng],
          rec_score: 1.0 // 목적지도 추천 점수 높게 설정 (예시)
        },
        start_dt: startDtFormatted,
        end_dt: endDtFormatted,
        avg_stay: 60, // 각 장소 평균 체류 시간 (분)
        alpha: 0.5 // 가중치 (필요에 따라 조절)
      };

      console.log('Sending payload to backend:', payload);

      // apiClient 인스턴스를 사용하여 POST 요청
      // baseURL이 이미 'http://localhost:8000/api/v1'이므로, 경로를 `/itinerary/multi`로 지정
      const response = await apiClient.post(`/itinerary/multi`, payload, {
        headers: { 'Content-Type': 'application/json' },
        // withCredentials는 apiClient 생성 시 설정했으므로 여기서 다시 명시할 필요는 없습니다.
      });

      console.log('Backend response:', response.data);
      setGeneratedCourse(response.data); // 백엔드로부터 받은 코스 데이터 저장

      // API 응답을 성공적으로 받은 후, 다음 페이지로 이동
      navigate('/busan-travel-plan', {
        state: {
          preferences: preferences,
          departureCity: departureCity,
          otherCity: otherCity,
          travelDuration: travelDuration,
          travelStartDate: travelStartDate,
          startingPoint: startingPoint,
          surveyAttractions: surveyAttractions,
          startingPoints: startingPoints,
          generatedCourse: response.data, // 받은 데이터 바로 전달
        }
      });

    } catch (error) {
      console.error('Failed to generate travel course:', error);
      // Axios 에러인 경우 상태 코드와 메시지를 더 자세히 로깅
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', error.response?.status, error.response?.data);
        alert(`여행 코스 생성 중 오류가 발생했습니다: ${error.response?.status} - ${error.response?.data?.detail || error.message}. 다시 시도해주세요.`);
      } else {
        alert('여행 코스 생성 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
      }
      setStage('additionalInfo'); // 에러 시 추가 정보 입력 단계로 돌아감
    }
  };

  // 추가 정보 제출 시 로딩 단계로 전환하고 여행 코스 생성 시작
  const handleSubmitAdditionalInfo = () => {
    setStage('loading'); // 로딩 UI 표시 시작
    generateTravelCourse(); // 백엔드 요청 시작
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* 시작 화면 */}
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

        {/* 로딩 화면 */}
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

        {/* 추가 정보 입력 화면 */}
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

        {/* 설문 질문 화면 */}
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
                <img src={`/images/${currentAttraction.id}.jpg`} alt={currentAttraction.name} className={styles.attractionImage} />
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