import { useState, useEffect, useRef } from 'react';
import styles from './SurveyPage.module.scss';

// 로딩 메시지와 부산 관련 사실 데이터
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

// 주요 도시 목록
const majorCities = [
  "서울", "인천", "대전", "대구", "광주", "울산", "제주"
];

// 여행지 데이터 (좌표 정보 추가)
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

// 부산 주요 출발지 옵션
const startingPoints = [
  { id: 'busan-station', name: '부산역', lat: 35.1156, lng: 129.0423 },
  { id: 'gimhae-airport', name: '김해공항', lat: 35.1796, lng: 128.9384 },
  { id: 'haeundae', name: '해운대', lat: 35.1587, lng: 129.1606 },
  { id: 'seomyeon', name: '서면', lat: 35.1575, lng: 129.0594 },
  { id: 'nampo', name: '남포동', lat: 35.0969, lng: 129.0286 }
];

export default function TravelSurvey() {
  // 상태 관리
  const [stage, setStage] = useState('start');
  const [preferences, setPreferences] = useState({});
  const [currentAttractionIndex, setCurrentAttractionIndex] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 추가 정보 상태
  const [departureCity, setDepartureCity] = useState('서울');
  const [otherCity, setOtherCity] = useState('');
  const [travelDuration, setTravelDuration] = useState(2);
  const [travelStartDate, setTravelStartDate] = useState('');
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);
  const [startingPoint, setStartingPoint] = useState('busan-station');

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePath, setRoutePath] = useState(null);

  const totalAttractions = surveyAttractions.filter(a => a.category !== '교통').length;
  const completedCount = Object.keys(preferences).length;

  // 로딩 메시지와 사실 관련 효과
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

      const loadingTimer = setTimeout(() => {
        setStage('results');
        clearInterval(messageInterval);
        clearInterval(factInterval);
        clearInterval(progressInterval);
        clearTimeout(loadingTimer);
      }, 8000);

      return () => {
        clearInterval(messageInterval);
        clearInterval(factInterval);
        clearInterval(progressInterval);
        clearTimeout(loadingTimer);
      };
    }
  }, [stage]);

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setTravelStartDate(formattedDate);
  }, []);

  // 카카오맵 API 로드 및 지도 초기화
  useEffect(() => {
    if (stage === 'mapRoute' && !map) {
      const script = document.createElement('script');
      script.async = true;
      // YOUR_KAKAO_MAP_KEY를 실제 카카오맵 API 키로 교체하세요!
      script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_KEY&autoload=false';
      document.head.appendChild(script);

      script.onload = () => {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      };

      // Kakao Maps API가 없는 경우를 대비한 폴백
      setTimeout(() => {
        if (!window.kakao) {
          initializeFallbackMap();
        }
      }, 3000);
    }
  }, [stage]);

  // 폴백 지도 초기화 (CSS로 구현)
  const initializeFallbackMap = () => {
    console.log("Kakao Maps API를 사용할 수 없습니다. 폴백 지도를 사용합니다.");
  };

  // 카카오 지도 초기화
  const initializeMap = () => {
    if (!mapRef.current) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(35.1379, 129.0756), // 부산 중심
      level: 8
    };

    const mapInstance = new window.kakao.maps.Map(container, options);
    setMap(mapInstance);

    // 추천 경로 표시
    displayRecommendedRoute(mapInstance);
  };

  // 추천 경로 표시
  const displayRecommendedRoute = (mapInstance) => {
    const selectedStartingPoint = startingPoints.find(p => p.id === startingPoint);
    const recommendations = getRecommendations();

    // 경로 생성: 출발지 → 추천 명소들
    const routePoints = [selectedStartingPoint, ...recommendations];

    // 기존 마커와 경로 제거
    markers.forEach(marker => marker.setMap(null));
    if (routePath) routePath.setMap(null);

    // 새 마커 생성
    const newMarkers = routePoints.map((point, index) => {
      const markerPosition = new window.kakao.maps.LatLng(point.lat, point.lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: mapInstance
      });

      // 마커 클릭 시 정보창 표시
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px; font-size:12px; width:150px; text-align:center;">
                    <strong>${index === 0 ? '출발지' : `${index}번째`}</strong><br/>
                    ${point.name}<br/>
                    ${point.description || ''}
                  </div>`
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(mapInstance, marker);
      });

      return marker;
    });

    // 경로 라인 그리기
    const linePath = routePoints.map(point => new window.kakao.maps.LatLng(point.lat, point.lng));
    const polyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 4,
      strokeColor: '#FF6B6B',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });

    polyline.setMap(mapInstance);

    setMarkers(newMarkers);
    setRoutePath(polyline);

    // 모든 마커가 보이도록 지도 범위 조정
    const bounds = new window.kakao.maps.LatLngBounds();
    routePoints.forEach(point => {
      bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng));
    });
    mapInstance.setBounds(bounds);
  };

  // 선호도 선택 핸들러
  const handlePreference = (preference) => {
    const currentAttraction = surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex];
    setPreferences(prev => ({ ...prev, [currentAttraction.id]: preference }));

    if (currentAttractionIndex < totalAttractions - 1) {
      setCurrentAttractionIndex(prevIndex => prevIndex + 1);
    } else {
      setStage('loading');
      setLoadingProgress(0);
    }
  };

  // 설문 시작 핸들러
  const handleStartSurvey = () => {
    setStage('survey');
    setCurrentAttractionIndex(0);
    setPreferences({});
  };

  // 설문 재시작 핸들러
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

  // 추가 정보 입력 화면으로 이동
  const handleContinueToAdditionalInfo = () => {
    setStage('additionalInfo');
  };

  // 도시 선택 핸들러
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setDepartureCity(selectedCity);
    setShowOtherCityInput(selectedCity === '기타');
  };

  // 지도 경로 화면으로 이동
  const handleShowMapRoute = () => {
    setStage('mapRoute');
  };

  // 현재 표시해야 할 명소 정보
  const currentAttraction = stage === 'survey'
    ? surveyAttractions.filter(a => a.category !== '교통')[currentAttractionIndex]
    : null;

  // 결과 분석 함수
  const getResults = () => {
    const categoryCounts = {};

    Object.entries(preferences).forEach(([attractionId, preference]) => {
      const attraction = surveyAttractions.find(a => a.id === parseInt(attractionId, 10));
      if (!attraction) return;

      if (!categoryCounts[attraction.category]) {
        categoryCounts[attraction.category] = { like: 0, neutral: 0, dislike: 0 };
      }

      categoryCounts[attraction.category][preference]++;
    });

    const categoryScores = Object.entries(categoryCounts).map(([category, counts]) => {
      const score = counts.like * 1 + counts.neutral * 0 + counts.dislike * -1;
      return { category, score };
    });

    return categoryScores.sort((a, b) => b.score - a.score);
  };

  // 추천 여행지 생성 함수
  const getRecommendations = () => {
    const results = getResults();
    const preferences_ranked = results.map(r => r.category);

    let recommendations = [];

    // 각 카테고리에서 좋아하는 장소들을 우선 선택
    preferences_ranked.forEach(category => {
      const categoryAttractions = surveyAttractions.filter(attr =>
        attr.category === category &&
        !recommendations.some(rec => rec.id === attr.id) &&
        attr.category !== '교통'
      );

      categoryAttractions.forEach(attr => {
        const userPreference = preferences[attr.id];
        if (userPreference === 'like' || userPreference === 'neutral') {
          recommendations.push({
            ...attr,
            reason: `${category} 카테고리에서 당신의 선호도가 높았습니다.`
          });
        }
      });
    });

    // 여행 기간에 맞게 제한 (하루에 2-3개 장소)
    const maxRecommendations = Math.min(travelDuration * 2, recommendations.length);
    return recommendations.slice(0, maxRecommendations);
  };

  // 최적 경로 계산 (간단한 휴리스틱)
  const calculateOptimalRoute = (startPoint, destinations) => {
    if (destinations.length <= 1) return destinations;

    // 거리 계산 함수 (하버사인 공식 근사)
    const calculateDistance = (point1, point2) => {
      const R = 6371; // 지구 반지름 (km)
      const dLat = (point2.lat - point1.lat) * Math.PI / 180;
      const dLng = (point2.lng - point1.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // 최근접 이웃 알고리즘
    const route = [];
    let currentPoint = startPoint;
    let remainingDestinations = [...destinations];

    while (remainingDestinations.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = calculateDistance(currentPoint, remainingDestinations[0]);

      for (let i = 1; i < remainingDestinations.length; i++) {
        const distance = calculateDistance(currentPoint, remainingDestinations[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nextDestination = remainingDestinations[nearestIndex];
      route.push(nextDestination);
      currentPoint = nextDestination;
      remainingDestinations.splice(nearestIndex, 1);
    }

    return route;
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

        {stage === 'results' && (
          <div className={styles.resultsScreen}>
            <h2 className={styles.resultsTitle}>당신의 여행 선호도 분석 결과</h2>

            <div className={styles.resultsList}>
              <h3 className={styles.resultsSubtitle}>선호하는 여행 카테고리:</h3>
              <div className={styles.categoryScores}>
                {getResults().map((result, index) => (
                  <div key={result.category} className={styles.categoryItem}>
                    <div className={styles.categoryRank}>
                      {index + 1}
                    </div>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryName}>{result.category}</div>
                      <div className={styles.scoreBarContainer}>
                        <div
                          className={styles.scoreBar}
                          style={{ width: `${Math.max(0, Math.min(100, (result.score / totalAttractions) * 100 + 50))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.recommendationsSection}>
              <h3 className={styles.recommendationsTitle}>당신을 위한 맞춤 추천 여행지</h3>
              <div className={styles.recommendationsList}>
                {getRecommendations().map(recommendation => (
                  <div key={recommendation.id} className={styles.recommendationCard}>
                    <img src={`/images/${recommendation.id}.jpg`} alt={recommendation.name} className={styles.recommendationImage} />
                    <div className={styles.recommendationContent}>
                      <h4 className={styles.recommendationName}>{recommendation.name}</h4>
                      <p className={styles.recommendationDescription}>{recommendation.description}</p>
                      <p className={styles.recommendationReason}>{recommendation.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.resultsFooter}>
              <button
                onClick={handleContinueToAdditionalInfo}
                className={styles.startButton}
              >
                여행 정보 입력하기
              </button>
              <button
                onClick={handleRestartSurvey}
                className={styles.restartButton}
              >
                설문 다시 하기
              </button>
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
                  onClick={handleShowMapRoute}
                  className={styles.startButton}
                >
                  여행 코스 지도 보기
                </button>
                <button
                  type="button"
                  onClick={() => setStage('results')}
                  className={styles.restartButton}
                >
                  이전으로
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'mapRoute' && (
          <div className={styles.resultsScreen}>
            <h2 className={styles.resultsTitle}>맞춤 부산 여행 코스</h2>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">출발 도시</div>
                  <div className="font-semibold text-gray-800">
                    {departureCity === '기타' ? otherCity : departureCity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">부산 출발지</div>
                  <div className="font-semibold text-gray-800">
                    {startingPoints.find(p => p.id === startingPoint)?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">여행 기간</div>
                  <div className="font-semibold text-gray-800">{travelDuration}일</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">시작 날짜</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(travelStartDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-gray-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                {!window.kakao ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700 mb-4">부산 여행 코스 지도</div>
                      <div className="space-y-2">
                        {(() => {
                          const selectedStart = startingPoints.find(p => p.id === startingPoint);
                          const recommendations = getRecommendations();
                          const optimalRoute = calculateOptimalRoute(selectedStart, recommendations);

                          return (
                            <div className="bg-white bg-opacity-80 rounded-lg p-4 max-w-md">
                              <div className="text-sm font-medium text-blue-800 mb-2">추천 경로</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">출발</div>
                                  <div>{selectedStart.name}</div>
                                </div>
                                {optimalRoute.map((location, index) => (
                                  <div key={location.id} className="flex items-center">
                                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">{index + 1}</div>
                                    <div>{location.name}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full"></div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">일별 여행 일정</h3>
              <div className="space-y-4">
                {(() => {
                  const selectedStart = startingPoints.find(p => p.id === startingPoint);
                  const recommendations = getRecommendations();
                  const optimalRoute = calculateOptimalRoute(selectedStart, recommendations);
                  const placesPerDay = Math.ceil(optimalRoute.length / travelDuration);

                  const dailySchedule = [];
                  for (let day = 0; day < travelDuration; day++) {
                    const startIndex = day * placesPerDay;
                    const endIndex = Math.min(startIndex + placesPerDay, optimalRoute.length);
                    const dayPlaces = optimalRoute.slice(startIndex, endIndex);

                    const date = new Date(travelStartDate);
                    date.setDate(date.getDate() + day);

                    dailySchedule.push({
                      day: day + 1,
                      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
                      places: dayPlaces,
                      isFirstDay: day === 0,
                      isLastDay: day === travelDuration - 1
                    });
                  }

                  return dailySchedule.map(dayInfo => (
                    <div key={dayInfo.day} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold mr-4">
                          DAY {dayInfo.day}
                        </div>
                        <div className="text-gray-600">{dayInfo.date}</div>
                      </div>

                      <div className="space-y-3">
                        {dayInfo.isFirstDay && (
                          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold">출발</div>
                            <div>
                              <div className="font-medium">{selectedStart.name}에서 여행 시작</div>
                              <div className="text-sm text-gray-600">
                                {departureCity === '기타' ? otherCity : departureCity}에서 부산 도착 후 여행 시작
                              </div>
                            </div>
                          </div>
                        )}

                        {dayInfo.places.map((place, index) => (
                          <div key={place.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-semibold">
                              {dayInfo.isFirstDay ? index + 1 : `${(dayInfo.day - 1) * placesPerDay + index + 1}`}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{place.name}</div>
                              <div className="text-sm text-gray-600 mb-1">{place.description}</div>
                              <div className="text-xs text-blue-600">권장 체류시간: {place.duration}시간</div>
                            </div>
                          </div>
                        ))}

                        {dayInfo.isLastDay && (
                          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">복귀</div>
                            <div>
                              <div className="font-medium">부산에서 {departureCity === '기타' ? otherCity : departureCity}로 출발</div>
                              <div className="text-sm text-gray-600">즐거운 여행을 마치고 집으로</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🌟 여행 팁</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                  <div className="font-medium mb-1">🚌 교통 정보</div>
                  <div>부산시티투어버스나 지하철 1일권을 활용하면 경제적이고 편리합니다.</div>
                </div>
                <div>
                  <div className="font-medium mb-1">🍽️ 맛집 추천</div>
                  <div>각 관광지 근처의 현지 맛집을 미리 검색해보세요.</div>
                </div>
                <div>
                  <div className="font-medium mb-1">📸 포토스팟</div>
                  <div>일몰 시간대의 해운대와 광안리, 감천문화마을의 계단길을 놓치지 마세요.</div>
                </div>
                <div>
                  <div className="font-medium mb-1">🎫 할인 정보</div>
                  <div>부산 관광패스를 구매하면 여러 관광지에서 할인 혜택을 받을 수 있습니다.</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestartSurvey}
                className={styles.startButton}
              >
                새로운 여행 계획하기
              </button>
              <button
                onClick={() => setStage('additionalInfo')}
                className={styles.restartButton}
              >
                정보 수정하기
              </button>
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