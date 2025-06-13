import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import DeleteIcon from "@mui/icons-material/Delete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// 관광지 예시 데이터 타입 (실제 데이터 구조에 따라 수정 필요)
const samplePlace = {
  id: 1,
  name: "해운대 해수욕장",
  description: "부산의 대표적인 해수욕장",
  duration: 2,
};

// 관광지 추천 함수 예시 (실제 데이터에 맞게 수정 필요)
const getRecommendations = () => {
  return [
    { id: 1, name: "해운대 해수욕장", description: "부산의 대표적인 해수욕장", duration: 2 },
    { id: 2, name: "광안리 해수욕장", description: "밤에도 아름다운 해변", duration: 2 },
    { id: 3, name: "자갈치 시장", description: "신선한 해산물 시장", duration: 1 },
    { id: 4, name: "부산타워", description: "부산의 랜드마크", duration: 1 },
    { id: 5, name: "태종대", description: "절경의 바다 전망", duration: 2 },
  ];
};

// 최적 경로 계산 함수 예시 (실제 로직에 맞게 수정 필요)
const calculateOptimalRoute = (startingPoint, places) => {
  // 시작점 + 추천 관광지 배열 반환 (예시)
  return places;
};

export default function TravelPlanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePath, setRoutePath] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isApiScriptLoaded, setIsApiScriptLoaded] = useState(false);

  const { state } = location;

  // 드래그 앤 드롭 리스트 정렬 함수
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // 관광지 추가/삭제/이동 핸들러
  const [dailySchedule, setDailySchedule] = useState([]);

  // state 기반 초기화
  useEffect(() => {
    if (!state) return;
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

    const selectedStartingPoint = startingPoints?.find((p) => p.id === startingPoint) || {
      id: 0,
      name: "부산역",
      description: "부산의 중심역",
    };
    const recommendations = getRecommendations();
    const optimalRoute = calculateOptimalRoute(selectedStartingPoint, recommendations);
    const placesPerDay = Math.ceil(optimalRoute.length / travelDuration);

    const initDailySchedule = [];
    for (let day = 0; day < travelDuration; day++) {
      const startIndex = day * placesPerDay;
      const endIndex = Math.min(startIndex + placesPerDay, optimalRoute.length);
      const dayPlaces = optimalRoute.slice(startIndex, endIndex);
      const date = new Date(travelStartDate);
      date.setDate(date.getDate() + day);

      initDailySchedule.push({
        day: day + 1,
        date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" }),
        places: dayPlaces,
        isFirstDay: day === 0,
        isLastDay: day === travelDuration - 1,
      });
    }
    setDailySchedule(initDailySchedule);
  }, [state]);

  // 관광지 추가 (예시: dayId에 관광지 추가)
  const addPlaceToDay = (dayId, place) => {
    setDailySchedule((prev) =>
      prev.map((day) =>
        day.day === dayId ? { ...day, places: [...day.places, place] } : day
      )
    );
  };

  // 관광지 삭제
  const removePlaceFromDay = (dayId, placeId) => {
    setDailySchedule((prev) =>
      prev.map((day) =>
        day.day === dayId
          ? { ...day, places: day.places.filter((p) => p.id !== placeId) }
          : day
      )
    );
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    // 같은 day 내 이동
    if (source.droppableId === destination.droppableId) {
      const dayId = parseInt(source.droppableId, 10);
      setDailySchedule((prev) =>
        prev.map((day) => {
          if (day.day !== dayId) return day;
          const reorderedPlaces = reorder(
            day.places,
            source.index,
            destination.index
          );
          return { ...day, places: reorderedPlaces };
        })
      );
    }
    // TODO: day 간 이동도 구현 가능 (여기서는 생략)
  };

  // state가 없으면 초기 페이지로 리다이렉트
  useEffect(() => {
    if (!state) {
      navigate("/");
    }
  }, [state, navigate]);

  // handleRestartSurvey 함수 정의
  const handleRestartSurvey = useCallback(() => {
    navigate("/");
  }, [navigate]);

  if (!state) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
          padding: 2,
          boxSizing: "border-box",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 5,
            borderRadius: "12px",
            textAlign: "center",
            maxWidth: "500px",
            width: "100%",
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

  const selectedStartingPoint = startingPoints?.find((p) => p.id === startingPoint) || {
    id: 0,
    name: "부산역",
    description: "부산의 중심역",
  };

  // 여행 개요 및 지도, 팁 영역
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        padding: 2,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          padding: 5,
          width: "100%",
          maxWidth: "1200px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          "@media (min-width: 768px)": {
            flexDirection: "row",
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            "@media (min-width: 768px)": {
              flex: "1 1 auto",
            },
          }}
        >
          {/* 여행 개요 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h2" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
              여행 일정
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" component="h3" color="text.primary">
                  여행 정보
                </Typography>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    출발지: {departureCity === "기타" ? otherCity : departureCity}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    여행지: 부산
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    여행 기간: {travelDuration}일
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    여행 시작일: {new Date(travelStartDate).toLocaleDateString("ko-KR")}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* 지도 영역 (예시, 실제로는 지도 API 연동 필요) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
              지도
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
              <Typography variant="body1" color="text.secondary">
                여행 일정에 따라 관광지 위치가 지도에 표시됩니다.
              </Typography>
              <Box
                ref={mapRef}
                sx={{
                  width: "100%",
                  height: "300px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "8px",
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  지도 영역 (API 연동 필요)
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* 일별 여행 일정 (드래그 앤 드롭 적용) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 3 }}>
              일별 여행 일정
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Stack spacing={3}>
                {dailySchedule.map((dayInfo) => (
                  <Paper key={dayInfo.day} elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(to right, #1976d2, #00bcd4)",
                          color: "white",
                          px: 2,
                          py: 1,
                          borderRadius: "8px",
                          fontWeight: "bold",
                          mr: 2,
                        }}
                      >
                        DAY {dayInfo.day}
                      </Box>
                      <Typography variant="body1" color="text.secondary">
                        {dayInfo.date}
                      </Typography>
                    </Box>

                    <Stack spacing={1.5}>
                      {dayInfo.isFirstDay && (
                        <Paper sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "8px" }}>
                          <Box sx={{ bgcolor: "success.main", color: "white", fontSize: "0.75rem", px: 1, py: 0.5, borderRadius: "4px", fontWeight: "bold" }}>
                            <FlightTakeoffIcon sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }} /> 출발
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedStartingPoint?.name}에서 여행 시작
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {departureCity === "기타" ? otherCity : departureCity}에서 부산 도착 후 여행 시작
                            </Typography>
                          </Box>
                        </Paper>
                      )}

                      <Droppable droppableId={dayInfo.day.toString()}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef}>
                            {dayInfo.places.map((place, index) => (
                              <Draggable key={place.id} draggableId={place.id.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <Paper
                                      sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 1.5,
                                        p: 2,
                                        borderRadius: "8px",
                                        mb: 1,
                                      }}
                                    >
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box sx={{ bgcolor: "info.main", color: "white", fontSize: "0.75rem", px: 1, py: 0.5, borderRadius: "4px", fontWeight: "bold" }}>
                                          <EventNoteIcon sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }} />
                                          {dayInfo.isFirstDay ? index + 1 : `${(dayInfo.day - 1) * Math.ceil(dayInfo.places.length / travelDuration) + index + 1}`}
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography variant="body1" fontWeight="medium">
                                            {place.name}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            {place.description}
                                          </Typography>
                                          <Typography variant="caption" color="primary.main">
                                            권장 체류시간: {place.duration}시간
                                          </Typography>
                                        </Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => removePlaceFromDay(dayInfo.day, place.id)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Paper>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {dayInfo.isLastDay && (
                        <Paper sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "8px" }}>
                          <Box sx={{ bgcolor: "error.main", color: "white", fontSize: "0.75rem", px: 1, py: 0.5, borderRadius: "4px", fontWeight: "bold" }}>
                            <FlightTakeoffIcon sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5, transform: "scaleX(-1)" }} /> 복귀
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              부산에서 {departureCity === "기타" ? otherCity : departureCity}로 출발
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              즐거운 여행을 마치고 집으로
                            </Typography>
                          </Box>
                        </Paper>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </DragDropContext>
          </Box>

          {/* 관광지 추가 UI (예시, 실제로는 드롭다운 등으로 구현) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
              관광지 추가
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body1" color="text.primary">
                  관광지 선택:
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const dayToAdd = prompt("추가할 날짜(DAY)를 입력하세요 (예: 1)");
                    if (dayToAdd) {
                      const dayId = parseInt(dayToAdd, 10);
                      addPlaceToDay(dayId, samplePlace);
                    }
                  }}
                >
                  예시 관광지 추가
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                실제 서비스에서는 드롭다운 또는 검색으로 관광지를 선택하여 추가합니다.
              </Typography>
            </Paper>
          </Box>

          {/* 여행 팁 및 버튼 영역 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
              여행 팁
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" component="h4" color="text.primary">
                  여행 준비물
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TipsAndUpdatesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="여권/신분증, 현금/카드" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TipsAndUpdatesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="필수 약품, 보조배터리" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TipsAndUpdatesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="날씨에 맞는 옷, 우산" />
                  </ListItem>
                </List>
              </Stack>
            </Paper>
          </Box>

          {/* 다시 설문하기 버튼 */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRestartSurvey}
              sx={{ fontWeight: "bold" }}
            >
              다시 설문하기
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
