// src/pages/SurveyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Link as MLink,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import GoogleIcon from "@mui/icons-material/Google";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import LogoutIcon from "@mui/icons-material/Logout";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScienceIcon from "@mui/icons-material/Science";
import SendIcon from "@mui/icons-material/Send";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PendingIcon from "@mui/icons-material/Pending";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import PlaceIcon from "@mui/icons-material/Place";

// ---------- 환경 변수 기반 API ORIGIN/BASE ----------
/**
 * REACT_APP_API_PREFIX 예시:
 *   https://wherewego-backend-production.up.railway.app
 */
const API_PREFIX =
  process.env.REACT_APP_API_PREFIX ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_PREFIX) ||
  "http://localhost:8000";

const API_BASE = `${API_PREFIX.replace(/\/$/, "")}/api/v1`;
const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google/login`;
const KAKAO_LOGIN_URL = `${API_BASE}/auth/kakao/login`;

// ---------- 공용 팔레트/스타일 토큰 ----------
const tone = {
  primary: "#4338CA", // indigo-600
  primarySoft: "#EEF2FF", // indigo-50
  accent: "#0D9488", // teal-600
  paper: "#ffffff",
  subtle: "#F7F7FB",
  border: "#E6E8EF",
  danger: "#DC2626",
};

// ---------- 공용 유틸 ----------
async function apiCall(url, options = {}) {
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- 메인 컴포넌트 ----------
export default function SurveyPage() {
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  // 로그인/설문 상태
  const [loginStatus, setLoginStatus] = useState({
    user_id: "",
    logged_in: false,
    has_survey_data: false,
    has_votes: false,
    status: "",
  });

  // 설문 입력
  const [activity, setActivity] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [time, setTime] = useState("");
  const [season, setSeason] = useState("");
  const [preference, setPreference] = useState("");

  // 추천/투표
  const [placeRecs, setPlaceRecs] = useState([]); // [{primary, alternative}, ...]
  const [currentVotes, setCurrentVotes] = useState([]); // [{round, choice, item_name}]
  const [mlRecs, setMlRecs] = useState([]); // 20곳

  useEffect(() => {
    handleCheckLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, severity = "info") =>
    setToast({ open: true, message, severity });

  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  // ---------- 1) 로그인 확인/로그아웃 ----------
  const handleCheckLogin = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/status`);
      setLoginStatus(resp);
      showToast(resp.logged_in ? "로그인됨" : "로그인 필요", resp.logged_in ? "success" : "warning");
    } catch (e) {
      showToast(`로그인 상태 확인 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiCall(`${API_BASE}/auth/logout`, { method: "POST" });
      setLoginStatus({
        user_id: "",
        logged_in: false,
        has_survey_data: false,
        has_votes: false,
        status: "",
      });
      showToast("로그아웃 완료", "success");
    } catch (e) {
      showToast(`로그아웃 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 2) 설문 제출 / 상태 ----------
  const handleSubmitSurvey = async () => {
    const surveyData = {
      activity,
      activity_level: activityLevel,
      time,
      season,
      preference,
    };
    if (!Object.values(surveyData).every(Boolean)) {
      showToast("모든 설문 항목을 선택해 주세요.", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/survey/submit`, {
        method: "POST",
        body: surveyData,
      });
      showToast(`설문 제출 완료: ${data.message}`, "success");
      await handleCheckLogin();
    } catch (e) {
      showToast(`설문 제출 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyStatus = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/status`);
      setLoginStatus(resp);

      let msg = `로그인: ${resp.logged_in ? "완료" : "미완료"}\n설문: ${
        resp.has_survey_data ? "완료" : "미완료"
      }\n투표: ${resp.has_votes ? "완료" : "미완료"}\n전체 상태: ${resp.status || "-"}`;
      showToast(msg, resp.has_survey_data ? "success" : "info");
    } catch (e) {
      showToast(`설문 상태 확인 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 3) 장소 추천 / 투표 ----------
  const handlePlaceRecs = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/place-recommendations`);
      setPlaceRecs(resp.recommendations || []);
      setCurrentVotes([]);
      showToast("장소 추천 완료", "success");
    } catch (e) {
      showToast(`장소 추천 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectVote = (roundIndex, choice, itemName) => {
    setCurrentVotes((prev) => {
      const copy = [...prev];
      copy[roundIndex] = { round: roundIndex + 1, choice, item_name: itemName };
      return copy;
    });
  };

  const isSelected = (roundIdx, which, name) => {
    const v = currentVotes[roundIdx];
    return v && v.choice === which && v.item_name === name;
  };

  const handleSubmitVotes = async () => {
    if (!placeRecs?.length) {
      showToast("먼저 장소 추천을 받으세요.", "warning");
      return;
    }
    if (currentVotes.filter(Boolean).length < placeRecs.length) {
      showToast("모든 라운드에 투표해 주세요.", "warning");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/votes`, {
        method: "POST",
        body: { votes: currentVotes },
      });
      showToast(`투표 제출 완료: ${resp.message}`, "success");
      await handleCheckLogin();
    } catch (e) {
      showToast(`투표 제출 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 4) ML 추천 ----------
  const handleMLRecs = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/ml-recommendations`);
      setMlRecs(resp.recommendations || []);
      showToast("ML 추천 완료 (20곳)", "success");
    } catch (e) {
      showToast(`ML 추천 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleModelStatus = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/model-status`);
      showToast(`ML 모델 상태: ${resp.model_loaded ? "로드됨" : "로드되지 않음"}`, "info");
    } catch (e) {
      showToast(`모델 상태 확인 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 5) 초기화 / 테스트 ----------
  const handleResetAll = async () => {
    if (!window.confirm("모든 설문/투표 데이터를 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/reset`, { method: "DELETE" });
      showToast(`데이터 초기화 완료: ${resp.message}`, "success");
      setPlaceRecs([]);
      setCurrentVotes([]);
      setMlRecs([]);
      await handleCheckLogin();
    } catch (e) {
      showToast(`초기화 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestGet = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/test`);
      showToast(`GET 테스트 성공: ${JSON.stringify(resp)}`, "success");
    } catch (e) {
      showToast(`GET 테스트 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPost = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/test-post`, {
        method: "POST",
        body: { test: "데이터", number: 123, array: [1, 2, 3] },
      });
      showToast(`POST 테스트 성공: ${JSON.stringify(resp)}`, "success");
    } catch (e) {
      showToast(`POST 테스트 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 렌더 ----------
  return (
    <Box sx={{ bgcolor: tone.subtle, minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        {/* 헤더 */}
        <Card
          elevation={0}
          sx={{
            mb: 4,
            border: `1px solid ${tone.border}`,
            background: `linear-gradient(120deg, ${tone.primarySoft}, #F0FDFA)`,
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h4" fontWeight={800} color={tone.primary}>
                  🗺️ WhereWeGo 설문 시스템
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mt: 0.5 }}>
                  JWT 토큰 기반 보안 설문·추천 테스트
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  color={loginStatus.logged_in ? "success" : "default"}
                  label={loginStatus.logged_in ? "로그인됨" : "로그아웃"}
                  variant="filled"
                />
                {loading && <CircularProgress size={24} />}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* 로그인 카드 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderColor: tone.border }}>
              <CardHeader
                avatar={<LoginIcon color="primary" />}
                title="1. 로그인"
                subheader="Google 또는 Kakao로 로그인하세요"
              />
              <CardContent>
                {loginStatus.logged_in ? (
                  <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                    로그인됨 — 설문:{' '}
                    <b>{loginStatus.has_survey_data ? "완료" : "미완료"}</b>, 투표:{' '}
                    <b>{loginStatus.has_votes ? "완료" : "미완료"}</b>
                  </Alert>
                ) : (
                  <Alert icon={<ErrorIcon fontSize="inherit" />} severity="warning" sx={{ mb: 2 }}>
                    로그인되어 있지 않습니다.
                  </Alert>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    startIcon={<GoogleIcon />}
                    variant="contained"
                    color="primary"
                    onClick={() => (window.location.href = GOOGLE_LOGIN_URL)}
                  >
                    Google 로그인
                  </Button>
                  <Button
                    startIcon={<ChatBubbleIcon />}
                    variant="outlined"
                    color="primary"
                    onClick={() => (window.location.href = KAKAO_LOGIN_URL)}
                  >
                    Kakao 로그인
                  </Button>
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between" }}>
                <Button size="small" onClick={handleCheckLogin}>
                  상태 새로고침
                </Button>
                <Button size="small" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                  로그아웃
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* 설문 카드 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderColor: tone.border }}>
              <CardHeader
                avatar={<ChecklistIcon color="primary" />}
                title="2. 설문조사"
                subheader="여행 선호를 선택하세요"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>활동 유형</InputLabel>
                      <Select label="활동 유형" value={activity} onChange={(e) => setActivity(e.target.value)}>
                        <MenuItem value=""><em>선택</em></MenuItem>
                        {["자연풍경","자연산림","관람및체험","휴양","테마거리","예술감상","공연관람","트레킹"].map(v => (
                          <MenuItem key={v} value={v}>{v}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>활동 수준</InputLabel>
                      <Select label="활동 수준" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                        <MenuItem value=""><em>선택</em></MenuItem>
                        <MenuItem value="낮음">낮음</MenuItem>
                        <MenuItem value="보통">보통</MenuItem>
                        <MenuItem value="높음">높음</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>시간대</InputLabel>
                      <Select label="시간대" value={time} onChange={(e) => setTime(e.target.value)}>
                        <MenuItem value=""><em>선택</em></MenuItem>
                        <MenuItem value="오전">오전</MenuItem>
                        <MenuItem value="오후">오후</MenuItem>
                        <MenuItem value="저녁">저녁</MenuItem>
                        <MenuItem value="밤">밤</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>계절</InputLabel>
                      <Select label="계절" value={season} onChange={(e) => setSeason(e.target.value)}>
                        <MenuItem value=""><em>선택</em></MenuItem>
                        <MenuItem value="봄">봄</MenuItem>
                        <MenuItem value="여름">여름</MenuItem>
                        <MenuItem value="가을">가을</MenuItem>
                        <MenuItem value="겨울">겨울</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>선호도</InputLabel>
                      <Select label="선호도" value={preference} onChange={(e) => setPreference(e.target.value)}>
                        <MenuItem value=""><em>선택</em></MenuItem>
                        <MenuItem value="활동성">활동성</MenuItem>
                        <MenuItem value="휴식">휴식</MenuItem>
                        <MenuItem value="문화">문화</MenuItem>
                        <MenuItem value="자연">자연</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions>
                <Button onClick={handleSubmitSurvey} variant="contained" startIcon={<SendIcon />}>
                  설문 제출
                </Button>
                <Button onClick={handleSurveyStatus} variant="text" startIcon={<PendingIcon />}>
                  설문 상태 확인
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* 투표 카드 */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ borderColor: tone.border }}>
              <CardHeader
                avatar={<HowToVoteIcon color="primary" />}
                title="3. 투표 (라운드 선택)"
                subheader="추천된 두 장소 중 선호하는 곳을 라운드별로 선택하세요"
              />
              <CardActions sx={{ px: 2, pt: 0 }}>
                <Button onClick={handlePlaceRecs} variant="outlined" startIcon={<TravelExploreIcon />}>
                  장소 추천 받기
                </Button>
                <Button onClick={handleSubmitVotes} variant="contained" startIcon={<HowToVoteIcon />}>
                  투표 제출
                </Button>
              </CardActions>

              <CardContent>
                {!placeRecs.length ? (
                  <Alert severity="info">아직 추천이 없습니다. “장소 추천 받기”를 눌러주세요.</Alert>
                ) : (
                  <Stack spacing={2} divider={<Divider />}>
                    {placeRecs.map((round, idx) => (
                      <Box key={idx}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          라운드 {idx + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Primary */}
                          <Grid item xs={12} md={6}>
                            <Card
                              variant="outlined"
                              onClick={() => selectVote(idx, "primary", round?.primary?.name || "Primary")}
                              sx={{
                                borderColor: isSelected(idx, "primary", round?.primary?.name) ? tone.accent : tone.border,
                                cursor: "pointer",
                                "&:hover": { borderColor: tone.primary },
                              }}
                            >
                              <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PlaceIcon sx={{ color: tone.primary }} />
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {round?.primary?.name || "Primary"}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  📍 {round?.primary?.address || "-"}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  🏷️ {round?.primary?.category || "-"}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* Alternative */}
                          <Grid item xs={12} md={6}>
                            <Card
                              variant="outlined"
                              onClick={() =>
                                selectVote(idx, "alternative", round?.alternative?.name || "Alternative")
                              }
                              sx={{
                                borderColor: isSelected(idx, "alternative", round?.alternative?.name)
                                  ? tone.accent
                                  : tone.border,
                                cursor: "pointer",
                                "&:hover": { borderColor: tone.primary },
                              }}
                            >
                              <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PlaceIcon sx={{ color: tone.primary }} />
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {round?.alternative?.name || "Alternative"}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  📍 {round?.alternative?.address || "-"}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  🏷️ {round?.alternative?.category || "-"}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ML 추천 카드 */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ borderColor: tone.border }}>
              <CardHeader
                avatar={<ScienceIcon color="primary" />}
                title="4. ML 모델 추천 (20곳)"
                subheader="설문과 투표를 기반으로 추천"
              />
              <CardActions sx={{ px: 2, pt: 0 }}>
                <Button variant="outlined" onClick={handleMLRecs} startIcon={<ScienceIcon />}>
                  ML 추천 받기
                </Button>
                <Button variant="text" onClick={handleModelStatus}>
                  모델 상태 확인
                </Button>
              </CardActions>
              <CardContent sx={{ maxHeight: 420, overflow: "auto" }}>
                {!mlRecs.length ? (
                  <Alert severity="info">아직 결과가 없습니다. “ML 추천 받기”를 눌러주세요.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {mlRecs.map((p, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.25,
                          border: `1px solid ${tone.border}`,
                          borderRadius: 1.5,
                          bgcolor: tone.paper,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          {i + 1}. {p.name || "이름 없음"}
                        </Typography>
                        <Typography variant="body2">📍 {p.address || "-"}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.75 }}>
                          🏷️ {p.category || "-"}
                        </Typography>
                        <Typography variant="body2">⭐ 평점: {p.rating ?? "N/A"}</Typography>
                        {p.description && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            📝 {p.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 관리/테스트 */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderColor: tone.border }}>
              <CardHeader title="5. 관리 / 6. 테스트" />
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button color="error" variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetAll}>
                  모든 데이터 초기화
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="text" onClick={handleTestGet}>
                  GET 테스트
                </Button>
                <Button variant="text" onClick={handleTestPost}>
                  POST 테스트
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* 하단 작은 도움말 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            API Base: <MLink href={API_BASE} target="_blank" rel="noreferrer">{API_BASE}</MLink>
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            프론트는 쿠키 인증 사용(fetch credentials: include)
          </Typography>
        </Stack>
      </Container>

      {/* 토스트 */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
        </Alert>
      </Snackbar>
    </Box>
  );
}
