import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// MUI 컴포넌트 임포트
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Stack,
  CircularProgress, // 로딩 인디케이터
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
// 필요한 아이콘만 남김
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'; // 출발/복귀 아이콘
import EventNoteIcon from '@mui/icons-material/EventNote'; // 일별 일정 아이콘
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'; // 여행 팁 아이콘

export default function TravelPlanPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 지도 관련 상태 및 참조
  const mapRef = useRef(null); // 지도를 띄울 div의 ref (getElementById 사용하므로 직접 사용되지는 않지만, 관례상 유지)
  const [map, setMap] = useState(null); // 카카오맵 인스턴스 저장
  const [markers, setMarkers] = useState([]); // 지도 마커 배열 저장
  const [routePath, setRoutePath] = useState(null); // 지도 경로 폴리라인 저장
  const [isMapLoaded, setIsMapLoaded] = useState(false); // 카카오맵 API 로드 상태 (스크립트 로드 완료 여부)
  const [isApiScriptLoaded, setIsApiScriptLoaded] = useState(false); // 카카오맵 SDK 스크립트 로드 성공 여부

  const { state } = location;

  const getResults = useCallback(() => {
    if (!state) return [];
    const { preferences, surveyAttractions } = state;
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
  }, [state]);

  const getRecommendations = useCallback(() => {
    if (!state) return [];
    const { preferences, surveyAttractions, travelDuration } = state;
    const results = getResults();
    const preferences_ranked = results.map(r => r.category);
    let recommendations = [];
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
    const maxRecommendations = Math.min(travelDuration * 2, recommendations.length);
    return recommendations.slice(0, maxRecommendations);
  }, [state, getResults]);

  const calculateOptimalRoute = useCallback((startPoint, destinations) => {
    if (destinations.length <= 1) return destinations;
    const calculateDistance = (point1, point2) => {
      const R = 6371; // 지구 반경 (킬로미터)
      const dLat = (point2.lat - point1.lat) * Math.PI / 180;
      const dLng = (point2.lng - point1.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 거리 (킬로미터)
    };
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
  }, []);

  // 지도에 추천 경로를 표시하는 함수
  const displayRecommendedRoute = useCallback((mapInstance) => {
    if (!state || !mapInstance || !window.kakao) return; // window.kakao 객체 확인 추가

    const { startingPoints, startingPoint: stateStartingPoint } = state;
    const selectedStartingPoint = startingPoints.find(p => p.id === stateStartingPoint);
    if (!selectedStartingPoint) return;

    const recommendations = getRecommendations();
    const optimalRoute = calculateOptimalRoute(selectedStartingPoint, recommendations);

    // 출발지와 최적 경로를 합쳐 지도에 표시할 전체 경로 포인트 배열을 만듭니다.
    const routePoints = [selectedStartingPoint, ...optimalRoute];

    // 기존 마커와 경로를 제거합니다.
    markers.forEach(marker => marker.setMap(null));
    if (routePath) routePath.setMap(null);

    // 새로운 마커를 생성하고 지도에 표시합니다.
    const newMarkers = routePoints.map((point, idx) => {
      const markerPosition = new window.kakao.maps.LatLng(point.lat, point.lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: mapInstance,
        // 출발지에 다른 아이콘을 사용할 수도 있습니다.
        // image: idx === 0 ? new window.kakao.maps.MarkerImage('출발지_아이콘_URL', new window.kakao.maps.Size(30, 30)) : undefined
      });

      // 마커에 정보창 추가 (클릭 시 표시)
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px; font-size:12px; width:150px; text-align:center;">
                    <strong>${idx === 0 ? '출발지' : `${idx}번째`}</strong><br/>
                    ${point.name}<br/>
                    ${point.description || ''}
                  </div>`,
        removable: true // 정보창 닫기 버튼 표시
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(mapInstance, marker);
      });
      return marker;
    });

    // 경로 폴리라인을 생성하고 지도에 표시합니다.
    const linePath = routePoints.map(point => new window.kakao.maps.LatLng(point.lat, point.lng));
    const polyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 4,
      strokeColor: '#FF6B6B', // 경로 색상
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });
    polyline.setMap(mapInstance);

    setMarkers(newMarkers);
    setRoutePath(polyline);

    // 모든 마커와 경로를 포함하도록 지도의 확대/축소를 조정합니다.
    const bounds = new window.kakao.maps.LatLngBounds();
    routePoints.forEach(point => {
      bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng));
    });
    mapInstance.setBounds(bounds);
  }, [state, getRecommendations, calculateOptimalRoute, markers, routePath]);

  // 카카오맵 API 초기화 함수
  const initializeMap = useCallback(() => {
    // 지도 컨테이너 엘리먼트 가져오기 (getElementById 사용)
    const container = document.getElementById('map');
    // 컨테이너가 없거나 window.kakao 객체가 없다면 지도를 초기화하지 않습니다.
    if (!container || !window.kakao) {
      console.error("initializeMap: 지도 컨테이너를 찾을 수 없거나 window.kakao 객체가 없습니다.");
      return;
    }

    // 카카오맵 인스턴스를 생성할 때 사용할 옵션
    const options = {
      // 초기 중심 좌표는 부산 시청 부근으로 설정 (예시)
      center: new window.kakao.maps.LatLng(35.1795, 129.0756),
      level: 8 // 초기 확대 레벨
    };

    // 지도 객체를 생성합니다. (new 키워드 사용)
    const mapInstance = new window.kakao.maps.Map(container, options);
    setMap(mapInstance); // 생성된 지도 인스턴스를 상태에 저장합니다.
    setIsMapLoaded(true); // 지도 초기화 완료 상태로 변경 (지도가 그려졌음을 의미)

    // 지도가 초기화되면 추천 경로를 표시합니다.
    displayRecommendedRoute(mapInstance);
  }, [displayRecommendedRoute]);

  // 카카오맵 API 스크립트 로드 및 지도 초기화 useEffect
  useEffect(() => {
    // state가 아직 로드되지 않았다면 스크립트 로드를 기다립니다.
    if (!state) return;

    // 카카오맵 API 스크립트가 이미 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      console.log("카카오맵 SDK 이미 로드됨. 바로 지도 초기화 시도.");
      setIsApiScriptLoaded(true); // 스크립트 로드 상태 true
      window.kakao.maps.load(() => {
        initializeMap();
      });
      return;
    }

    // 스크립트가 로드되지 않았다면 동적으로 추가
    const script = document.createElement('script');
    script.async = true;
    script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=88986aad7c8be65e76dd3e27567bd7fb&libraries=services,clusterer&autoload=false';
    document.head.appendChild(script);

    script.onload = () => {
      console.log("카카오맵 SDK 스크립트 로드 완료.");
      setIsApiScriptLoaded(true); // 스크립트 로드 상태 true
      // 스크립트 로드가 완료되면 지도 API를 로드하고 초기화합니다.
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    // 스크립트 로드 실패 또는 지연 시 폴백 (오류 발생 시 이 부분 실행)
    script.onerror = () => {
      console.error("카카오맵 API 스크립트 로드에 실패했습니다. 앱 키 또는 도메인 설정을 확인하세요.");
      setIsApiScriptLoaded(false); // 스크립트 로드 실패 상태
    };

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      if (document.head.contains(script)) { // script가 head에 있는지 확인 후 제거
        document.head.removeChild(script);
      }
      // 지도 인스턴스 정리 (필요시)
      if (map) {
        // map.relayout(); // 지도 크기 변경 등으로 인한 리레이아웃 필요 시 사용
        // map = null; // 지도 인스턴스 직접 해제 (필요시)
      }
    };
  }, [state, initializeMap, map]); // state, initializeMap, map 변경 시 재실행

  // state가 없으면 초기 페이지로 리다이렉트
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  // handleRestartSurvey 함수 정의
  const handleRestartSurvey = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // state가 로드되지 않았다면 로딩 화면을 표시합니다.
  if (!state) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f0f2f5',
          padding: 2,
          boxSizing: 'border-box',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 5,
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
          }}
        >
          <Typography variant="h5" component="h2" color="text.primary" mb={2}>
            정보를 불러오는 중...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            잠시만 기다려 주세요.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Destructure values from state
  const {
    preferences,
    departureCity,
    otherCity,
    travelDuration,
    travelStartDate,
    startingPoint,
    surveyAttractions,
    startingPoints,
  } = state;

  const selectedStartingPoint = startingPoints.find(p => p.id === startingPoint);
  const recommendations = getRecommendations();
  const optimalRoute = calculateOptimalRoute(selectedStartingPoint, recommendations);
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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: 2,
        boxSizing: 'border-box',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: 5,
          width: '100%',
          maxWidth: '1200px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          '@media (min-width: 768px)': {
            flexDirection: 'row',
          },
        }}
      >
        {/* 전체 컨텐츠 영역 */}
        <Box
          sx={{
            width: '100%',
            '@media (min-width: 768px)': {
              flex: '1 1 auto',
            },
          }}
        >
          <Typography variant="h4" component="h2" sx={{
            fontWeight: 700,
            color: '#333',
            textAlign: 'center',
            mb: 4,
            lineHeight: 1.3,
          }}>
            맞춤 부산 여행 코스
          </Typography>

          {/* 여행 개요 정보 */}
          <Paper
            sx={{
              background: 'linear-gradient(to right, #e3f2fd, #e0f7fa)',
              borderRadius: '12px',
              padding: 3,
              mb: 4,
            }}
          >
            <Grid container spacing={2} justifyContent="center" textAlign="center">
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">출발 도시</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  {departureCity === '기타' ? otherCity : departureCity}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">부산 출발지</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  {selectedStartingPoint?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">여행 기간</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  {travelDuration}일
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">시작 날짜</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  {new Date(travelStartDate).toLocaleDateString('ko-KR')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* 지도 영역 */}
          <Box sx={{ mb: 4 }}>
            <Paper
              sx={{
                height: '400px',
                backgroundColor: '#f5f5f5',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative', // 로딩 인디케이터 겹치기 위해 position 추가
              }}
            >
              {/* 지도를 띄울 div는 항상 DOM에 존재하도록 변경 */}
              <div id="map" style={{ width: '100%', height: '100%' }}></div>

              {/* isMapLoaded가 false일 때만 로딩 오버레이를 표시 */}
              {!isMapLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 반투명 배경
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1, // 지도 위에 표시
                  }}
                >
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    지도 로딩 중...
                  </Typography>
                  {!isApiScriptLoaded && ( // API 스크립트 로드 실패 시 추가 메시지
                    <Typography variant="body2" color="error">
                      (카카오맵 API 스크립트 로드 실패: 앱 키 또는 도메인 설정을 확인하세요.)
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Box>

          {/* 일별 여행 일정 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 3 }}>
              일별 여행 일정
            </Typography>
            <Stack spacing={3}>
              {dailySchedule.map(dayInfo => (
                <Paper key={dayInfo.day} elevation={2} sx={{ borderRadius: '12px', padding: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(to right, #1976d2, #00bcd4)',
                        color: 'white',
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        mr: 2,
                      }}
                    >
                      DAY {dayInfo.day}
                    </Box>
                    <Typography variant="body1" color="text.secondary">{dayInfo.date}</Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    {dayInfo.isFirstDay && (
                      <Paper sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, borderRadius: '8px' }}>
                        <Box sx={{ bgcolor: 'success.main', color: 'white', fontSize: '0.75rem', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>
                          <FlightTakeoffIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> 출발
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">{selectedStartingPoint?.name}에서 여행 시작</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {departureCity === '기타' ? otherCity : departureCity}에서 부산 도착 후 여행 시작
                          </Typography>
                        </Box>
                      </Paper>
                    )}

                    {dayInfo.places.map((place, index) => (
                      <Paper key={place.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, borderRadius: '8px' }}>
                        <Box sx={{ bgcolor: 'info.main', color: 'white', fontSize: '0.75rem', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>
                          <EventNoteIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
                          {dayInfo.isFirstDay ? index + 1 : `${(dayInfo.day - 1) * placesPerDay + index + 1}`}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="medium">{place.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{place.description}</Typography>
                          <Typography variant="caption" color="primary.main">권장 체류시간: {place.duration}시간</Typography>
                        </Box>
                      </Paper>
                    ))}

                    {dayInfo.isLastDay && (
                      <Paper sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, borderRadius: '8px' }}>
                        <Box sx={{ bgcolor: 'error.main', color: 'white', fontSize: '0.75rem', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>
                          <FlightTakeoffIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5, transform: 'scaleX(-1)' }} /> 복귀
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">부산에서 {departureCity === '기타' ? otherCity : departureCity}로 출발</Typography>
                          <Typography variant="body2" color="text.secondary">즐거운 여행을 마치고 집으로</Typography>
                        </Box>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* 여행 팁 */}
          <Paper
            sx={{
              backgroundColor: '#fffbe0',
              borderRadius: '12px',
              padding: 3,
              mb: 4,
            }}
          >
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: '#b38800', mb: 2 }}>
              🌟 여행 팁
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}><TipsAndUpdatesIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> 🚌 교통 정보</Typography>
                <Typography variant="body2" color="text.secondary">부산시티투어버스나 지하철 1일권을 활용하면 경제적이고 편리합니다.</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}><TipsAndUpdatesIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> 🍽️ 맛집 추천</Typography>
                <Typography variant="body2" color="text.secondary">각 관광지 근처의 현지 맛집을 미리 검색해보세요.</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}><TipsAndUpdatesIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> 📸 포토스팟</Typography>
                <Typography variant="body2" color="text.secondary">일몰 시간대의 해운대와 광안리, 감천문화마을의 계단길을 놓치지 마세요.</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}><TipsAndUpdatesIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> 🎫 할인 정보</Typography>
                <Typography variant="body2" color="text.secondary">부산 관광패스를 구매하면 여러 관광지에서 할인 혜택을 받을 수 있습니다.</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* 버튼 영역 */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              sx={{
                bgcolor: '#007bff',
                '&:hover': { bgcolor: '#0056b3' },
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: '180px',
                textTransform: 'none',
              }}
              onClick={handleRestartSurvey}
            >
              새로운 여행 계획하기
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#6c757d',
                '&:hover': { bgcolor: '#5a6268' },
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: '180px',
                textTransform: 'none',
              }}
              onClick={() => navigate('/survey', { state: { preferences, departureCity, otherCity, travelDuration, travelStartDate, startingPoint } })}
            >
              정보 수정하기
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}