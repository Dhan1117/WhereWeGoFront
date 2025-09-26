// src/pages/SurveyPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, CircularProgress, Container, Divider, FormControl, Grid,
  IconButton, InputLabel, Link as MLink, MenuItem, Select, Snackbar,
  Stack, Stepper, Step, StepLabel, Tooltip, Typography,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import GoogleIcon from "@mui/icons-material/Google";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import LogoutIcon from "@mui/icons-material/Logout";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScienceIcon from "@mui/icons-material/Science";
import SendIcon from "@mui/icons-material/Send";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PendingIcon from "@mui/icons-material/Pending";
import PlaceIcon from "@mui/icons-material/Place";
import { Search as SearchIcon } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";

// ---------- 환경 변수 ----------
const API_PREFIX =
  process.env.REACT_APP_API_PREFIX ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_PREFIX) ||
  "http://localhost:8000";
const API_BASE = `${API_PREFIX.replace(/\/$/, "")}/api/v1`;
const GOOGLE_LOGIN_URL = `${API_BASE}/auth/google/login`;
const KAKAO_LOGIN_URL = `${API_BASE}/auth/kakao/login`;
const GMAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

// ---------- 팔레트 ----------
const tone = {
  primary: "#4338CA",
  primarySoft: "#EEF2FF",
  accent: "#0D9488",
  paper: "#ffffff",
  subtle: "#F7F7FB",
  border: "#E6E8EF",
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

// ---------- 이미지 헬퍼 ----------
const PLACEHOLDER_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#eef2f7'/>
      <stop offset='100%' stop-color='#e5ecf5'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='675' fill='url(#g)'/>
  <g fill='none' stroke='#9aa4b2' stroke-width='28' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='170' y='140' width='860' height='460' rx='32'/>
    <circle cx='410' cy='340' r='70'/>
    <path d='M220 570l230-230 150 150 140-190 240 270z'/>
  </g>
</svg>`;
const PLACEHOLDER_URL = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

function extractPhotoUrl(place) {
  const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null);
  const candidates = [
    place?.photoUrl, place?.image, place?.thumbnail, place?.coverImage, place?.cover,
    place?.img, place?.picture, place?.mainImage, first(place?.images), first(place?.image_urls),
    place?.photo_url, place?.img_url, place?.image_url, first(place?.photos)?.url || first(place?.photos)?.photoUrl,
  ].filter(Boolean);
  if (candidates.length) return candidates[0];

  const photoRef =
    place?.photo_reference ||
    place?.photoReference ||
    (first(place?.photos)?.photo_reference ?? first(place?.photos)?.photoReference);
  if (photoRef && GMAPS_KEY) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${encodeURIComponent(
      photoRef
    )}&key=${GMAPS_KEY}`;
  }
  return "";
}

// ---------- 애니메이션 ----------
const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -20, scale: 0.98 },
};
const pageTransition = { type: "spring", stiffness: 260, damping: 24 };

const steps = ["로그인", "설문", "투표", "ML 추천", "관리/테스트"];

// ---------- 메인 ----------
export default function SurveyPage() {
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  // 진행 상태
  const [activeStep, setActiveStep] = useState(0);

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
  const [activityLevel, setActivityLevel] = useState(""); // 활동성
  const [time, setTime] = useState("");
  const [season, setSeason] = useState("");
  const [preference, setPreference] = useState(""); // 중요 요소(활동성/시간대)

  // 추천/투표/ML
  const [placeRecs, setPlaceRecs] = useState([]);
  const [currentVotes, setCurrentVotes] = useState([]);
  const [mlRecs, setMlRecs] = useState([]);

  useEffect(() => {
    (async () => {
      await handleCheckLogin();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, severity = "info") => setToast({ open: true, message, severity });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  // ---------- 1) 로그인 ----------
  const handleCheckLogin = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/status`);
      setLoginStatus(resp);
      setActiveStep(resp.logged_in ? 1 : 0);
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
      setLoginStatus({ user_id: "", logged_in: false, has_survey_data: false, has_votes: false, status: "" });
      setActiveStep(0);
      showToast("로그아웃 완료", "success");
    } catch (e) {
      showToast(`로그아웃 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 2) 설문 ----------
  const handleSubmitSurvey = async () => {
    const surveyData = { activity, activity_level: activityLevel, time, season, preference };
    if (!Object.values(surveyData).every(Boolean)) {
      showToast("모든 설문 항목을 선택해 주세요.", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/survey/submit`, { method: "POST", body: surveyData });
      showToast(`설문 제출 완료: ${data.message}`, "success");
      await handleCheckLogin();
      setActiveStep(2);
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
      let msg = `로그인: ${resp.logged_in ? "완료" : "미완료"}\n설문: ${resp.has_survey_data ? "완료" : "미완료"}\n투표: ${resp.has_votes ? "완료" : "미완료"}\n전체 상태: ${resp.status || "-"}`;
      showToast(msg, resp.has_survey_data ? "success" : "info");
    } catch (e) {
      showToast(`설문 상태 확인 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 3) 추천/투표 ----------
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

  // 5라운드 제한 & 단일 라운드 화면, 선택 시 자동 이동
  const rounds = useMemo(() => (placeRecs || []).slice(0, 5), [placeRecs]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  useEffect(() => {
    setCurrentRoundIdx(0);
  }, [placeRecs]);

  // 스텝2 진입 시 자동 추천 호출
  useEffect(() => {
    if (activeStep === 2 && (placeRecs?.length ?? 0) === 0) {
      handlePlaceRecs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const handleSelectAndAdvance = (roundIdx, which, name) => {
    selectVote(roundIdx, which, name);
    setTimeout(() => {
      if (roundIdx < rounds.length - 1) {
        setCurrentRoundIdx(roundIdx + 1);
      } else {
        showToast("마지막 라운드 선택 완료! '투표 제출'을 눌러주세요.", "info");
      }
    }, 120);
  };

  const handleSubmitVotes = async () => {
    if (!rounds?.length) {
      showToast("추천이 아직 준비되지 않았습니다.", "warning");
      return;
    }
    if (currentVotes.filter(Boolean).length < rounds.length) {
      showToast("모든 라운드에 투표해 주세요.", "warning");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/votes`, { method: "POST", body: { votes: currentVotes } });
      showToast(`투표 제출 완료: ${resp.message}`, "success");
      await handleCheckLogin();
      setActiveStep(3);
    } catch (e) {
      showToast(`투표 제출 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 상세 툴팁
  const DetailTooltipTitle = (p) => (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={700}>{p?.name || "이름 없음"}</Typography>
      <Typography variant="caption">📍 {p?.address || "-"}</Typography><br />
      <Typography variant="caption">🏷️ {p?.category || "-"}</Typography><br />
      <Typography variant="caption">⭐ {p?.rating ?? "N/A"}</Typography>
      {p?.description && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="caption" sx={{ whiteSpace: "pre-wrap" }}>{p.description}</Typography>
        </>
      )}
    </Box>
  );

  // --- 대형 선택 카드 ---
  const BigChoiceCard = ({ label, place, selected, onSelect }) => {
    const [src, setSrc] = useState(() => extractPhotoUrl(place) || PLACEHOLDER_URL);
    useEffect(() => {
      const url = extractPhotoUrl(place) || PLACEHOLDER_URL;
      setSrc(url);
    }, [place]);

    return (
      <Card
        variant="outlined"
        onClick={onSelect}
        sx={{
          borderColor: selected ? tone.accent : tone.border,
          transition: "border-color .2s, transform .15s, box-shadow .2s",
          cursor: "pointer",
          "&:hover": { borderColor: tone.primary, transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(0,0,0,0.06)" },
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" alignItems="flex-start" spacing={1.25}>
            <PlaceIcon sx={{ color: tone.primary, mt: "3px", fontSize: 24 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={900} noWrap>
                {label}: {place?.name || "-"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }} noWrap>
                📍 {place?.address || "-"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.75 }} noWrap>
                🏷️ {place?.category || "-"} · ⭐ {place?.rating ?? "N/A"}
              </Typography>
            </Box>
            <Tooltip title={DetailTooltipTitle(place)} arrow placement="left" componentsProps={{ tooltip: { sx: { maxWidth: 360 } } }}>
              <IconButton size="medium" onClick={(e) => e.stopPropagation()} aria-label="상세보기">
                <SearchIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ mt: 2, borderRadius: 3, overflow: "hidden", bgcolor: "#eef2f7" }}>
            <img
              src={src}
              alt={place?.name || "place"}
              loading="lazy"
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 360, objectFit: "cover" }}
              onError={(e) => {
                if (e.currentTarget.src !== PLACEHOLDER_URL) e.currentTarget.src = PLACEHOLDER_URL;
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ---------- 4) ML ----------
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

  // ---------- 5) 초기화/테스트 ----------
  const handleResetAll = async () => {
    if (!window.confirm("모든 설문/투표 데이터를 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/reset`, { method: "DELETE" });
      showToast(`데이터 초기화 완료: ${resp.message}`, "success");
      setPlaceRecs([]); setCurrentVotes([]); setMlRecs([]);
      await handleCheckLogin();
      setActiveStep(loginStatus.logged_in ? 1 : 0);
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
        method: "POST", body: { test: "데이터", number: 123, array: [1, 2, 3] },
      });
      showToast(`POST 테스트 성공: ${JSON.stringify(resp)}`, "success");
    } catch (e) {
      showToast(`POST 테스트 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- 6) spot-recommend로 이동 ----------
  const goSpotRecommend = () => {
    if (!mlRecs?.length) {
      showToast("먼저 ML 추천을 받아주세요.", "warning");
      return;
    }
    const attractions = mlRecs.map((p, i) => ({
      id: p._id || p.id || String(i + 1),
      name: p.name,
      lat: p.location?.coordinates?.[1],
      lng: p.location?.coordinates?.[0],
      address: p.address,
      rating: p.rating,
      category: p.category,
      description: p.description,
      image: p.photoUrl || p.image || "",
      // === ML 점수/출처/이유 추가 ===
      ml_score:
        p.ml_score ?? p.mlScore ?? p.score ?? p.similarity ?? p.similarity_score ??
        p.relevance ?? p.model_score ?? p.rankScore ?? p.rank ?? null,
      source: "ml",
      reason: p.reason || p.explain || p.explanation || "",
    }));
    navigate("/tourist-spot-recommend", {
      state: {
        user_id: loginStatus?.user_id || "",
        attractions,
        isMlList: true,
        source: "ml",
      },
    });
  };

  // ---------- 스텝 조절 ----------
  const canGoNext = useMemo(() => {
    switch (activeStep) {
      case 0: return loginStatus.logged_in;
      case 1: return [activity, activityLevel, time, season, preference].every(Boolean);
      case 2: return rounds.length > 0 && currentVotes.filter(Boolean).length === rounds.length;
      case 3: return mlRecs.length > 0;
      default: return true;
    }
  }, [activeStep, loginStatus, activity, activityLevel, time, season, preference, rounds, currentVotes, mlRecs]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  // ---------- 렌더 ----------
  return (
    <Box sx={{ bgcolor: tone.subtle, minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        {/* 헤더 */}
        <Card elevation={0} sx={{ mb: 4, border: `1px solid ${tone.border}`, background: `linear-gradient(120deg, ${tone.primarySoft}, #F0FDFA)` }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h4" fontWeight={800} color={tone.primary}>🗺️ WhereWeGo 설문 시스템</Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mt: 0.5 }}>JWT 토큰 기반 보안 설문·추천 테스트</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip color={loginStatus.logged_in ? "success" : "default"} label={loginStatus.logged_in ? "로그인됨" : "로그아웃"} variant="filled" />
                {loading && <CircularProgress size={24} />}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* 스텝퍼 */}
        <Card variant="outlined" sx={{ mb: 3, borderColor: tone.border }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* 본문 */}
        <AnimatePresence mode="wait">
          {/* STEP 0: 로그인 */}
          {activeStep === 0 && (
            <motion.div key="step-login" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: tone.border }}>
                    <CardHeader avatar={<LoginIcon color="primary" />} title="1. 로그인" subheader="Google 또는 Kakao로 로그인하세요" />
                    <CardContent>
                      {loginStatus.logged_in ? (
                        <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                          로그인됨 — 설문: <b>{loginStatus.has_survey_data ? "완료" : "미완료"}</b>, 투표: <b>{loginStatus.has_votes ? "완료" : "미완료"}</b>
                        </Alert>
                      ) : (
                        <Alert icon={<ErrorIcon fontSize="inherit" />} severity="warning" sx={{ mb: 2 }}>
                          로그인되어 있지 않습니다.
                        </Alert>
                      )}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button startIcon={<GoogleIcon />} variant="contained" color="primary" onClick={() => (window.location.href = GOOGLE_LOGIN_URL)}>Google 로그인</Button>
                        <Button startIcon={<ChatBubbleIcon />} variant="outlined" color="primary" onClick={() => (window.location.href = KAKAO_LOGIN_URL)}>Kakao 로그인</Button>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={handleCheckLogin}>상태 새로고침</Button>
                        {loginStatus.logged_in && <Button size="small" variant="contained" onClick={() => setActiveStep(1)}>다음으로</Button>}
                      </Stack>
                      <Button size="small" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>로그아웃</Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* STEP 1: 설문 */}
          {activeStep === 1 && (
            <motion.div key="step-survey" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: tone.border }}>
                    <CardHeader avatar={<ChecklistIcon color="primary" />} title="2. 관광 선호도 조사" subheader="중요하게 생각하는 요소를 선택해주세요" />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>활동 유형</InputLabel>
                            <Select label="활동 유형" value={activity} onChange={(e) => setActivity(e.target.value)}>
                              <MenuItem value=""><em>선택</em></MenuItem>
                              {["자연풍경", "자연산림", "관람및체험", "휴양", "테마거리", "예술감상", "공연관람", "트레킹"].map((v) => (
                                <MenuItem key={v} value={v}>{v}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>활동성</InputLabel>
                            <Select label="활동성" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
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
                            <InputLabel>중요 요소</InputLabel>
                            <Select label="중요 요소" value={preference} onChange={(e) => setPreference(e.target.value)}>
                              <MenuItem value=""><em>선택</em></MenuItem>
                              <MenuItem value="활동성">활동성</MenuItem>
                              <MenuItem value="시간대">시간대</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Button disabled={activeStep === 0} onClick={handleBack}>뒤로</Button>
                      <Stack direction="row" spacing={1}>
                        <Button onClick={handleSurveyStatus} startIcon={<PendingIcon />}>설문 상태</Button>
                        <Button onClick={handleSubmitSurvey} variant="contained" startIcon={<SendIcon />}>설문 제출</Button>
                        <Button disabled={!canGoNext} variant="outlined" onClick={handleNext}>다음</Button>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* STEP 2: 투표 (이미지, 자동 다음 라운드) */}
          {activeStep === 2 && (
            <motion.div key="step-vote" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: tone.border }}>
                    <CardHeader avatar={<HowToVoteIcon color="primary" />} title="3. 투표 (라운드 선택)" subheader="추천된 두 장소 중 선호하는 곳을 라운드별로 선택하세요" />
                    <CardActions sx={{ px: 2, pt: 0 }}>
                      <Button onClick={handleSubmitVotes} variant="contained" startIcon={<HowToVoteIcon />}>
                        투표 제출
                      </Button>
                    </CardActions>

                    <CardContent>
                      {!rounds.length ? (
                        <Alert severity="info">추천을 준비하고 있어요… 잠시만요.</Alert>
                      ) : (
                        <>
                          <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>
                            라운드 {currentRoundIdx + 1} / {rounds.length}
                          </Typography>
                          <Divider sx={{ mb: 3 }} />

                          {(() => {
                            const round = rounds[currentRoundIdx] || {};
                            return (
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <BigChoiceCard
                                    label="Primary"
                                    place={round?.primary}
                                    selected={isSelected(currentRoundIdx, "primary", round?.primary?.name)}
                                    onSelect={() => handleSelectAndAdvance(currentRoundIdx, "primary", round?.primary?.name || "Primary")}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <BigChoiceCard
                                    label="Alternative"
                                    place={round?.alternative}
                                    selected={isSelected(currentRoundIdx, "alternative", round?.alternative?.name)}
                                    onSelect={() => handleSelectAndAdvance(currentRoundIdx, "alternative", round?.alternative?.name || "Alternative")}
                                  />
                                </Grid>
                              </Grid>
                            );
                          })()}

                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                            <Typography variant="body1" sx={{ opacity: 0.8 }}>
                              현재 선택:{" "}
                              {currentVotes[currentRoundIdx]?.choice
                                ? `${currentVotes[currentRoundIdx].choice} · ${currentVotes[currentRoundIdx].item_name}`
                                : "없음"}
                            </Typography>
                          </Stack>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* STEP 3: ML */}
          {activeStep === 3 && (
            <motion.div key="step-ml" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: tone.border }}>
                    <CardHeader avatar={<ScienceIcon color="primary" />} title="4. ML 모델 추천 (20곳)" subheader="설문과 투표를 기반으로 추천" />
                    <CardActions sx={{ px: 2, pt: 0 }}>
                      <Button variant="outlined" onClick={handleMLRecs} startIcon={<ScienceIcon />}>ML 추천 받기</Button>
                      <Button variant="text" onClick={handleModelStatus}>모델 상태 확인</Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button onClick={handleBack}>뒤로</Button>
                      <Button disabled={!canGoNext} variant="outlined" onClick={handleNext}>다음</Button>
                    </CardActions>
                    <CardContent sx={{ maxHeight: 420, overflow: "auto" }}>
                      {!mlRecs.length ? (
                        <Alert severity="info">아직 결과가 없습니다. “ML 추천 받기”를 눌러주세요.</Alert>
                      ) : (
                        <Stack spacing={1.5}>
                          {mlRecs.map((p, i) => (
                            <Box key={p._id || p.id || i} sx={{ p: 1.25, border: `1px solid ${tone.border}`, borderRadius: 1.5, bgcolor: tone.paper }}>
                              <Typography variant="subtitle2" fontWeight={700}>{i + 1}. {p.name || "이름 없음"}</Typography>
                              <Typography variant="body2">📍 {p.address || "-"}</Typography>
                              <Typography variant="body2" sx={{ opacity: 0.75 }}>🏷️ {p.category || "-"}</Typography>
                              <Typography variant="body2">⭐ 평점: {p.rating ?? "N/A"}</Typography>
                              {!!(p.reason || p.explain || p.explanation) && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>🧠 추천 이유: {p.reason || p.explain || p.explanation}</Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                    <CardActions sx={{ px: 2, pt: 0 }}>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button variant="contained" onClick={goSpotRecommend}>관광지 고르러 가기</Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* STEP 4: 관리 / 테스트 */}
          {activeStep === 4 && (
            <motion.div key="step-admin" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: tone.border }}>
                    <CardHeader title="5. 관리 / 6. 테스트" />
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button color="error" variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetAll}>모든 데이터 초기화</Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button variant="text" onClick={handleTestGet}>GET 테스트</Button>
                      <Button variant="text" onClick={handleTestPost}>POST 테스트</Button>
                      <Button onClick={handleBack}>뒤로</Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            API Base: <MLink href={API_BASE} target="_blank" rel="noreferrer">{API_BASE}</MLink>
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>프론트는 쿠키 인증 사용 (credentials: include)</Typography>
        </Stack>
      </Container>

      {/* 토스트 */}
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
        </Alert>
      </Snackbar>
    </Box>
  );
}
