import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import DeleteIcon from "@mui/icons-material/Delete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// 예시 관광지 데이터 (백엔드 없이 프론트에서 사용)
const samplePlaces = [
  { id: 1, name: "해운대 해수욕장", description: "부산의 대표 해수욕장", duration: 2 },
  { id: 2, name: "광안리 해수욕장", description: "밤에도 아름다운 해변", duration: 2 },
  { id: 3, name: "감천문화마을", description: "색색의 집들이 산비탈에 늘어선 예술 마을", duration: 2 },
  { id: 4, name: "태종대", description: "기암절벽과 바다가 어우러진 공원", duration: 3 },
  { id: 5, name: "부산역", description: "부산의 관문", duration: 0.5 },
  { id: 6, name: "남포동", description: "쇼핑과 번화가", duration: 2 },
  { id: 7, name: "자갈치시장", description: "신선한 해산물 시장", duration: 1.5 },
  { id: 8, name: "용두산공원", description: "부산 시내 전망", duration: 1 }
];

// 예시 출발지 데이터
const startingPoints = [
  { id: "busan-station", name: "부산역", lat: 35.1156, lng: 129.0423 },
  { id: "gimhae-airport", name: "김해공항", lat: 35.1796, lng: 128.9384 },
  { id: "haeundae", name: "해운대", lat: 35.1587, lng: 129.1606 },
  { id: "seomyeon", name: "서면", lat: 35.1575, lng: 129.0594 },
  { id: "nampo", name: "남포동", lat: 35.0969, lng: 129.0286 }
];

export default function TravelPlanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePath, setRoutePath] = useState(null);

  // state에서 데이터가 없으면 기본값 사용 (백엔드 없이 프론트에서만 동작)
  const { state } = location;
  const preferences = state?.preferences || {};
  const departureCity = state?.departureCity || "서울";
  const otherCity = state?.otherCity || "";
  const travelDuration = state?.travelDuration || 2;
  const travelStartDate = state?.travelStartDate || new Date().toISOString().split("T")[0];
  const startingPoint = state?.startingPoint || "busan-station";
  const selectedStartingPoint = startingPoints.find(p => p.id === startingPoint) || startingPoints[0];

  // 백엔드 호출 없이, 예시 데이터로 일정 생성
  const [dailySchedule, setDailySchedule] = useState([]);

  // 예시로 최적 경로 대신 samplePlaces를 사용
  const getRecommendations = () => samplePlaces;
  const calculateOptimalRoute = (start, places) => places; // 실제 최적화 없이 그대로 반환

  // 일정 초기화 (백엔드 없이 프론트에서만)
  useEffect(() => {
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
  }, [travelDuration, travelStartDate, selectedStartingPoint]);

  // 리스트 정렬 함수
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

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
    // day 간 이동은 여기서 생략
  };

  // state가 없으면 초기 페이지로 리다이렉트 (필요시)
  useEffect(() => {
    // if (!state) {
    //   navigate("/");
    // }
  }, [state, navigate]);

  // 설문 다시하기 버튼 (예시)
  const handleRestartSurvey = () => {
    navigate("/");
  };

  // 백엔드 호출 부분은 모두 주석 처리 (아래는 예시로 남겨둠)
  /*
  const generateTravelCourse = async () => {
    // ... 백엔드 호출 코드 ...
  };
  */

  // 관광지 추가 UI용 함수
  const handleAddPlace = () => {
    const dayToAdd = prompt("추가할 날짜(DAY)를 입력하세요 (예: 1)");
    if (dayToAdd) {
      const dayId = parseInt(dayToAdd, 10);
      const placeToAdd = samplePlaces.find(p => !dailySchedule.some(day => day.places.some(pl => pl.id === p.id)));
      if (placeToAdd) {
        addPlaceToDay(dayId, placeToAdd);
      } else {
        alert("추가할 수 있는 관광지가 없습니다.");
      }
    }
  };

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
                    여행 시작일: {travelStartDate}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* 지도 영역 (예시) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h3" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
              지도
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: "12px", padding: 3 }}>
              <Typography variant="body1" color="text.secondary">
                여행 일정에 따라 관광지 위치가 지도에 표시됩니다.
              </Typography>
              <Box
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
                  지도 영역 (예시)
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
                              {selectedStartingPoint.name}에서 여행 시작
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

          {/* 관광지 추가 UI (프론트에서만 동작) */}
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
                  onClick={handleAddPlace}
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
