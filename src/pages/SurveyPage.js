import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SurveyPage.module.scss';

// ──────────────────────────────────────────────────────────────────────────────
// 고정 데이터
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

const majorCities = ["서울", "인천", "대전", "대구", "광주", "울산", "제주"];

const surveyAttractions = [
  { id: 1, name: "해운대", description: "넓은 백사장과 푸른 바다가 아름다운 부산의 대표 해수욕장", category: "해변", lat: 35.1587, lng: 129.1606, duration: 3 },
  { id: 2, name: "광안리", description: "광안대교 야경과 트렌디한 카페, 맛집이 어우러진 활기찬 해변", category: "해변", lat: 35.1532, lng: 129.1197, duration: 2 },
  { id: 3, name: "감천문화마을", description: "형형색색의 집들이 계단식으로 늘어선 아름다운 문화 예술 마을", category: "문화", lat: 35.0979, lng: 129.0108, duration: 2 },
  { id: 4, name: "태종대", description: "기암절벽과 푸른 바다가 어우러진 부산의 아름다운 자연 공원", category: "자연", lat: 35.0518, lng: 129.0873, duration: 3 },
  { id: 5, name: "부산역", description: "부산의 관문이자 교통의 중심지", category: "교통", lat: 35.1156, lng: 129.0423, duration: 0.5 },
  { id: 6, name: "남포동", description: "부산의 대표적인 번화가이자 쇼핑 중심지", category: "쇼핑", lat: 35.0969, lng: 129.0286, duration: 2 },
  { id: 7, name: "자갈치시장", description: "한국 최대의 수산물 시장으로 신선한 해산물을 맛볼 수 있는 곳", category: "음식", lat: 35.0969, lng: 129.0308, duration: 1.5 },
  { id: 8, name: "용두산공원", description: "부산 시내를 한눈에 내려다볼 수 있는 전망 명소", category: "자연", lat: 35.1008, lng: 129.0324, duration: 1 }
];

const startingPoints = [
  { id: '6870f39e748cc28771f1b2a7', name: '부산역' },
  { id: '6870f39e748cc28771f1b2a8', name: '김해국제공항' },
  { id: '6870f39e748cc28771f1b2a3', name: '부산서부시외버스터미널' },
  { id: '6870f39e748cc28771f1b2a5', name: '사상시외버스터미널' },
  { id: '6870f39e748cc28771f1b2a6', name: '부산종합버스터미널' },
  { id: '6870f39e748cc28771f1b2a4', name: '부산항 국제여객터미널' }
];

// ──────────────────────────────────────────────────────────────────────────────
export default function SurveyPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState('start');   // 'start' | 'survey' | 'additionalInfo' | 'loading' | 'detailed'
  const [surveyMode, setSurveyMode] = useState(null); // 'simple' | 'detailed' | null

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [departureCity, setDepartureCity] = useState('서울');
  const [otherCity, setOtherCity] = useState('');
  const [travelDuration, setTravelDuration] = useState(2);
  const [travelStartDate, setTravelStartDate] = useState('');
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);
  const [startingPoint, setStartingPoint] = useState(startingPoints[0].id);

  const [preferences, setPreferences] = useState({});
  const [currentAttractionIndex, setCurrentAttractionIndex] = useState(0);

  const totalAttractions = surveyAttractions.filter(a => a.category !== '교통').length;
  const completedCount = Object.keys(preferences).length;

  // 자세한 설문(옵션) 상태 — 필요시 사용
  const [detailCategories, setDetailCategories] = useState({
    해변: true, 자연: true, 문화: true, 쇼핑: false, 음식: true, 야경: true, 카페: false, 사찰: false, 가족형: false
  });

  useEffect(() => {
    const today = new Date();
    setTravelStartDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (stage === 'loading') {
      const a = setInterval(() => setLoadingMessageIndex(p => (p + 1) % loadingMessages.length), 2000);
      const b = setInterval(() => setFactIndex(p => (p + 1) % facts.length), 4000);
      const c = setInterval(() => setLoadingProgress(p => Math.min(p + 5, 95)), 500);
      return () => { clearInterval(a); clearInterval(b); clearInterval(c); };
    }
  }, [stage]);

  // ── 모드 선택
  const handleStartSimple = () => { setSurveyMode('simple'); setStage('survey'); setPreferences({}); setCurrentAttractionIndex(0); };
  const handleStartDetailed = () => { setSurveyMode('detailed'); setStage('detailed'); };

  // ── 공통 초기화
  const handleRestartSurvey = () => {
    setStage('start'); setSurveyMode(null);
    setCurrentAttractionIndex(0); setPreferences({});
    setDepartureCity('서울'); setOtherCity(''); setTravelDuration(2);
    setTravelStartDate(new Date().toISOString().split('T')[0]);
    setShowOtherCityInput(false); setStartingPoint(startingPoints[0].id);
    setDetailCategories({ 해변: true, 자연: true, 문화: true, 쇼핑: false, 음식: true, 야경: true, 카페: false, 사찰: false, 가족형: false });
  };

  const handleCityChange = (e) => {
    const v = e.target.value; setDepartureCity(v); setShowOtherCityInput(v === '기타');
  };

  // ── 간단 설문 진행
  const handlePreference = (pref) => {
    const current = surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex];
    setPreferences(prev => ({ ...prev, [String(current.id)]: pref === 'like' }));
    if (currentAttractionIndex < totalAttractions - 1) setCurrentAttractionIndex(i => i + 1);
    else setStage('additionalInfo');
  };

  // ── 간단 설문 → 추천 10개 페이지로 이동 (백엔드 호출 없이 state 전달)
  const handleSubmitAdditionalInfo = () => {
    navigate('/tourist-spot-recommend', {
      state: {
        mode: 'simple',
        departureCity,
        otherCity,
        travelDuration,
        travelStartDate,
        startingPoint,
        preferences,
        surveyAttractions: surveyAttractions.map(a => String(a.id))
      }
    });
  };

  const currentAttraction = stage === 'survey'
    ? surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex]
    : null;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>

        {/* 시작: 모드 선택 */}
        {stage === 'start' && (
          <div className={styles.startScreen}>
            <h1 className={styles.startTitle}>부산 여행 스타일 찾기</h1>
            <p className={styles.startSubtitle}>원하는 설문 방식을 선택하세요.</p>

            <div className={styles.modeCards}>
              {/* 간단 설문 카드 */}
              <button
                type="button"
                onClick={handleStartSimple}
                className={`${styles.modeCard} ${styles.modeCardSimple}`}
                aria-label="간단한 설문 시작"
              >
                <div className={styles.modeCardHeader}>
                  <span className={styles.modePill}>추천 속도 ↑</span>
                </div>
                <div className={styles.modeIcon} aria-hidden>👍</div>
                <h3 className={styles.modeTitle}>간단한 설문</h3>
                <p className={styles.modeDesc}>
                  명소 카드를 보며 <b>좋아요/모르겠어요/싫어요</b>만 선택<br />
                  빠르게 10개씩 추천 받아요.
                </p>
                <div className={styles.modeCta}>시작하기</div>
              </button>

              {/* 자세한 설문 카드 */}
              <button
                type="button"
                onClick={handleStartDetailed}
                className={`${styles.modeCard} ${styles.modeCardDetailed}`}
                aria-label="자세한 설문 시작"
              >
                <div className={styles.modeCardHeader}>
                  <span className={styles.modePill}>정밀도 ↑</span>
                </div>
                <div className={styles.modeIcon} aria-hidden>🧭</div>
                <h3 className={styles.modeTitle}>자세한 설문</h3>
                <p className={styles.modeDesc}>
                  취향·예산·동행·시간대 등 <b>세부 설정</b>으로<br />
                  더 정교한 코스를 만들어 보세요.
                </p>
                <div className={styles.modeCta}>시작하기</div>
              </button>
            </div>
          </div>
        )}


        {/* 로딩 */}
        {stage === 'loading' && (
          <div className={styles.loadingScreen}>
            <h2 className={styles.loadingTitle}>분석 중...</h2>
            <div className={styles.loadingProgressContainer}>
              <div className={styles.loadingProgressBar} style={{ width: `${loadingProgress}%` }} />
            </div>
            <p className={styles.loadingMessage}>{loadingMessages[loadingMessageIndex]}</p>
            <div className={styles.factBox}>
              <h3 className={styles.factTitle}>알고 계셨나요?</h3>
              <p className={styles.factText}>{facts[factIndex]}</p>
            </div>
          </div>
        )}

        {/* 간단 설문 후 추가 정보 */}
        {stage === 'additionalInfo' && surveyMode === 'simple' && (
          <div className={styles.resultsScreen}>
            <h2 className={styles.resultsTitle}>추가 정보 입력</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>출발 도시</label>
                <select className={styles.infoSelect} value={departureCity} onChange={handleCityChange}>
                  {majorCities.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="기타">기타</option>
                </select>
              </div>
              {showOtherCityInput && (
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>출발 도시명 입력</label>
                  <input type="text" className={styles.infoInput} value={otherCity}
                    onChange={(e) => setOtherCity(e.target.value)} placeholder="도시명을 입력하세요" />
                </div>
              )}
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>부산 내 출발지</label>
                <select className={styles.infoSelect} value={startingPoint} onChange={(e) => setStartingPoint(e.target.value)}>
                  {startingPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>여행 시작일</label>
                <input type="date" className={styles.infoInput} value={travelStartDate}
                  onChange={(e) => setTravelStartDate(e.target.value)} />
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>여행 기간 (일)</label>
                <div className={styles.durationControl}>
                  <button type="button" className={styles.durationButton} onClick={() => setTravelDuration(p => Math.max(1, p - 1))}>-</button>
                  <span className={styles.durationValue}>{travelDuration}</span>
                  <button type="button" className={styles.durationButton} onClick={() => setTravelDuration(p => p + 1)}>+</button>
                </div>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <button type="button" onClick={handleSubmitAdditionalInfo} className={styles.startButton}>여행 코스 생성하기</button>
                <button type="button" onClick={handleRestartSurvey} className={styles.restartButton}>처음으로</button>
              </div>
            </div>
          </div>
        )}

        {/* 간단 설문 진행 화면 */}
        {stage === 'survey' && surveyMode === 'simple' && (
          <div className={styles.surveyScreen}>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${(completedCount / totalAttractions) * 100}%` }} />
            </div>
            <div className={styles.questionCounter}>{currentAttractionIndex + 1} / {totalAttractions}</div>
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
              <button onClick={() => handlePreference('like')} className={`${styles.preferenceButton} ${styles.likeButton}`}>
                <span className={styles.buttonIcon}>👍</span><span className={styles.buttonText}>좋아요</span>
              </button>
              <button onClick={() => handlePreference('neutral')} className={`${styles.preferenceButton} ${styles.neutralButton}`}>
                <span className={styles.buttonIcon}>🤔</span><span className={styles.buttonText}>모르겠어요</span>
              </button>
              <button onClick={() => handlePreference('dislike')} className={`${styles.preferenceButton} ${styles.dislikeButton}`}>
                <span className={styles.buttonIcon}>👎</span><span className={styles.buttonText}>싫어요</span>
              </button>
            </div>
          </div>
        )}

        {/* (선택) 자세한 설문 폼은 필요 시 추가 */}
        {stage === 'detailed' && (
          <div className={styles.resultsScreen}>
            <h2 className={styles.resultsTitle}>자세한 설문</h2>
            <p className="text-center text-gray-600 mb-8">간단 설문만 쓰실 거면 이 섹션은 생략 가능합니다.</p>
            {/* …필요 시 폼 구성 … */}
            <button type="button" onClick={handleRestartSurvey} className={styles.restartButton}>처음으로</button>
          </div>
        )}
      </div>
    </div>
  );
}
