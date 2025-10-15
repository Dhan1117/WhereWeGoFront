/* global google */

// src/pages/SurveyPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, CircularProgress, Container, Divider, FormControl, Grid,
  IconButton, InputLabel, Link as MLink, MenuItem, Select, Snackbar,
  Stack, Stepper, Step, StepLabel, Tooltip, Typography,
  Skeleton, Badge, MobileStepper, Paper, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LoginIcon from "@mui/icons-material/Login";
import GoogleIcon from "@mui/icons-material/Google";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScienceIcon from "@mui/icons-material/Science";
import SendIcon from "@mui/icons-material/Send";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PendingIcon from "@mui/icons-material/Pending";
import PlaceIcon from "@mui/icons-material/Place";
import { Search as SearchIcon, ArrowBack, ArrowForward } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";


// ✅ UA 기반 감지
import { isMobile as isMobileUA, isAndroid, isIOS } from "react-device-detect";

/* ==========================================================================
   환경 변수 / 상수
   ========================================================================== */
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

// ⛳ 로컬 관리자 우회 플래그 키 (프론트 데모용)
const BYPASS_KEY = "wwg_admin_bypass";

/* ==========================================================================
   팔레트 / 스타일 토큰
   ========================================================================== */
const tone = {
  primary: "#4338CA",
  primarySoft: "#EEF2FF",
  accent: "#0D9488",
  paper: "#ffffff",
  subtle: "#F7F7FB",
  border: "#E6E8EF",
  cardGrad: "linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 40%, #ECFEFF 100%)",
};

/* ==========================================================================
   공용 유틸
   ========================================================================== */
// ML 추천 결과 → 공통 정규화 유틸
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ML 응답 한 항목을 공통 스키마로 정규화
const normalizeMlSpot = (p, i = 0) => {
  // 항상 MongoDB ObjectId인 item_id를 최우선 사용
  const primaryId = p?.item_id || p?._id || p?.content_id || p?.id || p?.ml_index || (i + 1);
  return {
    // ↓ TouristSpotRecommendPage에서 공통적으로 쓰는 id를 확실히 채워줌
    id: String(primaryId),
    item_id: p?.item_id ? String(p.item_id) : undefined,
    _id: p?._id ? String(p._id) : undefined,
    name: p?.item_name || p?.name || "(이름 없음)",
    category_type: p?.category_type ?? p?.categoryType ?? null,
    address: p?.address || p?.road_address || "",
    lat: toNum(p?.lat ?? p?.latitude ?? p?.y),
    lng: toNum(p?.lng ?? p?.longitude ?? p?.x),
    category: p?.category || p?.category_type || "",
    rating: typeof p?.rating === "number" ? p.rating : null,
    image:
      p?.photoUrl ||
      p?.image ||
      (p?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${encodeURIComponent(
          p.photo_reference
        )}&key=${GMAPS_KEY}`
        : PLACEHOLDER_URL),
    ml_score: typeof p?.score === "number" ? p.score : null,
    reason: p?.reason || "",
    source: "ml",
  };
};
// ✅ 라운드 추천(투표) 카드 이미지 보강
async function augmentRoundImages(rounds) {
  // Google Places 로더
  const loader = new Loader({
    apiKey: GMAPS_KEY,
    libraries: ["places"],
    region: "KR",
    language: "ko",
  });
  await loader.load();

  const mapDiv = document.createElement("div");
  const service = new window.google.maps.places.PlacesService(mapDiv);
  const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

  // 원본 변형하지 않도록 복사
  const next = rounds.map(r => ({
    ...r,
    primary: r.primary ? { ...r.primary } : null,
    alternative: r.alternative ? { ...r.alternative } : null,
  }));

  // 내부 유틸: 이미지 없으면 채우기
  const fillPhoto = async (spot) => {
    if (!spot) return;
    const already =
      spot.image &&
      !/^data:image/i.test(spot.image) &&
      !/placeholder/i.test(spot.image);
    if (already) return;

    const q = (spot.name || "").trim();
    if (!q) return;

    const place = await new Promise((resolve) => {
      service.textSearch(
        {
          query: `부산 ${q}`,
          location: new window.google.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
        radius: 50000,
          language: "ko",
        },
        (results) => resolve(Array.isArray(results) && results.length ? results[0] : null)
      );
    });
    if (!place?.place_id) return;

    const details = await new Promise((resolve) => {
      service.getDetails(
        { placeId: place.place_id, language: "ko", fields: ["photos"] },
        (d) => resolve(d || null)
      );
    });

    const url = details?.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 900 });
    if (url) spot.image = url;
  };

  // 각 라운드의 양쪽 옵션 보강
  for (const r of next) {
    await fillPhoto(r.primary);
    await fillPhoto(r.alternative);
  }
  return next;
}

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
  if (res.status === 204) return {}; // 빈 응답 허용
  if (!res.ok) {
    let errDetail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      errDetail = err.detail || err.message || errDetail;
    } catch { }
    throw new Error(errDetail);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/* ==========================================================================
   이미지 헬퍼
   ========================================================================== */
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

/* ==========================================================================
   애니메이션
   ========================================================================== */
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
};
const pageTransition = { type: "spring", stiffness: 260, damping: 24 };

const steps = ["로그인", "설문", "투표", "ML 추천", "관리/테스트"];

// 카드 등장/선택 애니메이션
const cardEnter = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 18 } },
};
const cardTap = { whileTap: { scale: 0.98 } };
const selectedPulse = {
  animate: { boxShadow: ["0 0 0 0px rgba(13,148,136,0.45)", "0 0 0 16px rgba(13,148,136,0)"] },
  transition: { duration: 1.25, repeat: Infinity, ease: "easeOut" },
};

/* ==========================================================================
   공용 컴포넌트
   ========================================================================== */
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

function BigChoiceCardInner({ label, place, selected, onSelect, compact = false, disabled = false }) {
  const [src, setSrc] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  useEffect(() => {
    const url = extractPhotoUrl(place) || PLACEHOLDER_URL;
    setImgLoaded(false);
    setSrc(url);
  }, [place]);

  return (
    <Badge
      invisible={!selected}
      overlap="circular"
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      badgeContent={<Chip label="선택됨" color="success" size="small" sx={{ fontWeight: 700 }} />}
      sx={{ width: "100%" }}
    >
      <motion.div
        variants={cardEnter}
        initial="hidden"
        animate="show"
        {...cardTap}
        style={{ width: "100%" }}
      >
        <motion.div
          {...(selected ? selectedPulse : {})}
          style={{ borderRadius: 20 }}
        >
          <Card
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onKeyDown={(e) => !disabled && ((e.key === "Enter" || e.key === " ") && onSelect())}
            variant="outlined"
            onClick={() => !disabled && onSelect()}
            sx={{
              outline: "none",
              borderWidth: 2,
              borderColor: selected ? tone.accent : tone.border,
              cursor: disabled ? "not-allowed" : "pointer",
              position: "relative",
              transition: "all .2s",
              background: tone.cardGrad,
              minHeight: compact ? 260 : 360,
              display: "flex",
              flexDirection: "column",
              "&:hover": disabled ? {} : {
                borderColor: tone.primary,
                transform: "translateY(-3px)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              },
              ...(selected && { boxShadow: `0 0 0 3px ${tone.accent}33 inset` }),
            }}
          >
            <CardContent sx={{ p: compact ? 2.5 : { xs: 3, md: 3.5 }, flex: 1 }}>
              <Stack direction="row" alignItems="flex-start" spacing={1.25} sx={{ mb: 1 }}>
                <PlaceIcon sx={{ color: tone.primary, mt: "3px", fontSize: 24 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={900} noWrap>
                    {compact ? label + " · " : ""}{place?.name || "-"}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>📍 {place?.address || "-"}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>🏷️ {place?.category || "-"} · ⭐ {place?.rating ?? "N/A"}</Typography>
                </Box>
                <Tooltip title={DetailTooltipTitle(place)} arrow placement="left" componentsProps={{ tooltip: { sx: { maxWidth: 320 } } }}>
                  <IconButton type="button" size="small" onClick={(e) => e.stopPropagation()} aria-label="상세보기">
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box
                sx={{
                  mt: 1.25,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: "#eef2f7",
                  position: "relative",
                  aspectRatio: "16/10",
                }}
              >
                {!imgLoaded && (
                  <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: "absolute", inset: 0 }} />
                )}
                <img
                  src={src}
                  alt={place?.name || "place"}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{ display: imgLoaded ? "block" : "none", width: "100%", height: "100%", objectFit: "cover" }}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER_URL; setImgLoaded(true); }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Badge>
  );
}
const BigChoiceCard = React.memo(BigChoiceCardInner);

/* ==========================================================================
   메인 컴포넌트
   ========================================================================== */
export default function SurveyPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  // ✅ 화면폭 기반 감지 (깜빡임 방지: noSsr)
  const isViewportMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  // ✅ UA 기반
  const isDeviceMobile = isMobileUA || isAndroid || isIOS;
  // ✅ 최종 모바일 판정 + URL 강제 스위치 (?m=1 / ?m=0)
  const finalIsMobile = useMemo(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    let v = isDeviceMobile || isViewportMobile;
    if (params.get("m") === "1") v = true;
    if (params.get("m") === "0") v = false;
    return v;
  }, [isViewportMobile, isDeviceMobile]);

  /* ------------------ UI/상태 ------------------ */
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });
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
  const [activityLevel, setActivityLevel] = useState("");
  const [time, setTime] = useState("");
  const [season, setSeason] = useState("");
  const [preference, setPreference] = useState("");

  // 추천/투표/ML
  const [placeRecs, setPlaceRecs] = useState([]);
  // currentVotes[i] = { round, choice, item_name }
  const [currentVotes, setCurrentVotes] = useState([]);
  const [mlRecs, setMlRecs] = useState([]);

  // 라운드 UX
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false); // 2초 대기 중 중복클릭 방지

  useEffect(() => { (async () => { await handleCheckLogin(); })(); /* eslint-disable-next-line */ }, []);

  const showToast = (message, severity = "info") => setToast({ open: true, message, severity });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  /* ------------------ 로그인 ------------------ */
  const adminBypassLogin = () => {
    localStorage.setItem(BYPASS_KEY, "1");
    const dummy = {
      user_id: "dev-admin",
      logged_in: true,
      has_survey_data: false,
      has_votes: false,
      status: "bypass",
    };
    setLoginStatus(dummy);
    setActiveStep(1);
    showToast("관리자(로컬) 로그인 완료 — 백엔드 미사용", "success");
  };
  const continueWithoutLogin = () => {
    const guest = { user_id: "guest", logged_in: false, has_survey_data: false, has_votes: false, status: "guest" };
    setLoginStatus(guest);
    setActiveStep(1);
    showToast("로그인 없이 진행합니다.", "info");
  };

  const handleCheckLogin = async () => {
    setLoading(true);
    try {
      if (localStorage.getItem(BYPASS_KEY) === "1") {
        const dummy = { user_id: "dev-admin", logged_in: true, has_survey_data: false, has_votes: false, status: "bypass" };
        setLoginStatus(dummy);
        setActiveStep(1);
        showToast("관리자(로컬) 로그인 유지 중", "success");
        return;
      }
      const resp = await apiCall(`${API_BASE}/survey`);
      const loggedIn = !!(resp && (resp.logged_in || resp.user_id));
      setLoginStatus({
        user_id: resp?.user_id || "",
        logged_in: loggedIn,
        has_survey_data: !!resp?.has_survey_data,
        has_votes: !!resp?.has_votes,
        status: resp?.status || "",
      });
      setActiveStep(loggedIn ? 1 : 0);
      showToast(loggedIn ? "로그인됨" : "로그인 필요", loggedIn ? "success" : "warning");
    } catch (e) {
      showToast(`로그인 상태 확인 실패: ${e.message}`, "error");
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(BYPASS_KEY);
      try { await apiCall(`${API_BASE}/auth/logout`, { method: "POST" }); } catch { }
      setLoginStatus({ user_id: "", logged_in: false, has_survey_data: false, has_votes: false, status: "" });
      setActiveStep(0);
      showToast("로그아웃 완료", "success");
    } catch (e) {
      showToast(`로그아웃 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ 설문 ------------------ */
  const handleSubmitSurvey = async () => {
    const surveyDataRaw = { activity, activity_level: activityLevel, time, season, preference };
    if (!Object.values(surveyDataRaw).every(Boolean)) {
      showToast("모든 설문 항목을 선택해 주세요.", "warning");
      return;
    }
    const levelMap = { "보통": "중간" };
    const surveyData = { ...surveyDataRaw, activity_level: levelMap[surveyDataRaw.activity_level] || surveyDataRaw.activity_level };

    setLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/survey/submit`, { method: "POST", body: surveyData });
      showToast(data?.message || "설문 제출 완료", "success");
      setActiveStep(2); // 설문 후 투표로 이동
    } catch (e) {
      showToast(`설문 제출 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyStatus = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/data`);
      const msg = [
        `상태: ${resp?.status || "-"}`,
        `총 투표 수: ${resp?.total_votes ?? 0}`,
        resp?.database_info ? `DB: ${JSON.stringify(resp.database_info)}` : "",
      ].filter(Boolean).join("\n");
      showToast(msg || "상태 조회 완료", "info");
    } catch (e) {
      showToast(`설문 상태 확인 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ 추천/투표 ------------------ */
  const handlePlaceRecs = async () => {
    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/place-recommendations`);
      const mapped = (resp?.recommendations || []).map((r) => ({
        round_number: r.round_number,
        primary: r.option_a?.item || null,
        alternative: r.option_b?.item || null,
      }));
      const withPhotos = await augmentRoundImages(mapped);
      setPlaceRecs(withPhotos);
      // 선택 초기화
      setCurrentVotes([]);
      setSelectedMessage("");
      setIsAdvancing(false);
      setCurrentRoundIdx(0);
      showToast("장소 추천 완료", "success");
    } catch (e) {
      setPlaceRecs([]);
      setCurrentVotes([]);
      showToast(`추천 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (roundIdx, which, name) => {
    const v = currentVotes[roundIdx];
    const want = which === "primary" ? "option_a" : "option_b";
    return v && v.choice === want && v.item_name === name;
  };

  const rounds = useMemo(() => (placeRecs || []).slice(0, 5), [placeRecs]);

  useEffect(() => {
    if (activeStep === 2 && (placeRecs?.length ?? 0) === 0) handlePlaceRecs();
  }, [activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택 저장 (백엔드 스펙: round / choice / item_name) — item_index 없음
  const selectVote = (roundIndex, which, item) => {
    const choice = which === "primary" ? "option_a" : "option_b";
    setCurrentVotes((prev) => {
      const copy = [...prev];
      copy[roundIndex] = {
        round: roundIndex + 1,     // ✅ round 필드 사용
        choice,                    // "option_a" | "option_b"
        item_name: item?.name || null,
      };
      return copy;
    });
  };

  // 선택 → 메시지 표시 → 2초 후 자동 이동
  const handleSelectAndAdvance = (roundIdx, which, item) => {
    if (isAdvancing) return;
    selectVote(roundIdx, which, item);
    setSelectedMessage(`${item?.name || "선택 항목"}을(를) 고르셨습니다 ✅`);
    setIsAdvancing(true);
    setTimeout(() => {
      setSelectedMessage("");
      setIsAdvancing(false);
      if (roundIdx < rounds.length - 1) {
        setCurrentRoundIdx(roundIdx + 1);
      } else {
        showToast("마지막 라운드 선택 완료! '투표 제출'을 눌러주세요.", "info");
      }
    }, 2000);
  };

  // ✅ 투표 전체 한 번에 전송
  const handleSubmitVotes = async () => {
    if (!rounds?.length) {
      showToast("추천이 아직 준비되지 않았습니다.", "warning");
      return;
    }
    // 라운드별 누락 검사 (index 정렬 기준)
    const missing = [];
    for (let i = 0; i < rounds.length; i++) {
      if (!currentVotes[i] || !currentVotes[i]?.choice || !currentVotes[i]?.item_name) {
        missing.push(i + 1);
      }
    }
    if (missing.length) {
      showToast(`라운드 ${missing.join(", ")}의 선택 정보가 누락되었어요. 다시 선택해 주세요.`, "warning");
      // 가장 작은 누락 라운드로 이동
      const firstMissing = Math.min(...missing) - 1;
      setCurrentRoundIdx(firstMissing);
      return;
    }

    const payloadVotes = currentVotes
      .slice(0, rounds.length)
      .map((v, i) => ({ round: i + 1, choice: v.choice, item_name: v.item_name }));

    setLoading(true);
    try {
      const resp = await apiCall(`${API_BASE}/survey/votes`, {
        method: "POST",
        body: { votes: payloadVotes },
      });
      showToast(resp?.message ? `투표 제출 완료: ${resp.message}` : "투표 제출 완료", "success");
      // 상태 동기화(선택)
      try { await handleCheckLogin(); } catch { }
      setActiveStep(3);
    } catch (e) {
      showToast(`투표 제출 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ ML ------------------ */
  // ✅ ML 추천: 백엔드 응답을 normalizeMlSpot()으로 통일
  const handleMLRecs = async () => {
    setLoading(true);
    try {
      const uid = loginStatus?.user_id;
      if (!uid) {
        showToast("user_id가 필요합니다. 먼저 로그인해 주세요.", "warning");
        setLoading(false);
        return;
      }

      const resp = await apiCall(
        `${API_BASE}/survey/ml-recommendations?user_id=${encodeURIComponent(uid)}&k=20`
      );

      const raw = Array.isArray(resp?.recommendations) ? resp.recommendations : [];
      const normalized = raw.map((p, i) => normalizeMlSpot(p, i));

      // Google Places API 로드
      const loader = new Loader({
        apiKey: GMAPS_KEY,
        libraries: ["places"],
        region: "KR",
        language: "ko",
      });
      await loader.load();

      // eslint-disable-next-line no-undef
      const mapDiv = document.createElement("div");
      // eslint-disable-next-line no-undef
      const service = new window.google.maps.places.PlacesService(mapDiv);
      const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

      for (const spot of normalized) {
        const hasImage =
          spot.image &&
          !/^data:image/i.test(spot.image) &&
          !/placeholder/i.test(spot.image);
        if (hasImage) continue;

        const query = (spot.name || "").trim();
        if (!query) continue;

        // eslint-disable-next-line no-undef
        const place = await new Promise((resolve) => {
          service.textSearch(
            {
              query: `부산 ${query}`,
              // eslint-disable-next-line no-undef
              location: new window.google.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
              radius: 50000,
              language: "ko",
            },
            (results) => resolve(Array.isArray(results) && results.length ? results[0] : null)
          );
        });

        if (!place?.place_id) continue;

        const details = await new Promise((resolve) => {
          service.getDetails(
            { placeId: place.place_id, language: "ko", fields: ["photos"] },
            (d) => resolve(d || null)
          );
        });

        const url = details?.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 900 });
        if (url) spot.image = url;
      }

      setMlRecs(normalized);
      showToast(resp?.message || `ML 추천 완료 (${normalized.length}곳)`, "success");
    } catch (e) {
      showToast(`ML 추천 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 기존 goSpotRecommend 교체
  const goSpotRecommend = () => {
    if (!mlRecs?.length) {
      showToast("먼저 ML 추천을 받아주세요.", "warning");
      return;
    }

    navigate("/tourist-spot-recommend", {
      state: {
        user_id: loginStatus?.user_id || "",
        attractions: mlRecs.map((r, i) => ({
          id: String(r.id || r.item_id || r._id || r.content_id || r.ml_index || i + 1),
          name: r.name || r.item_name || "",          // ✅ name 확실히 전달 (제목 문제 해결)
          address: r.address || "",
          lat: r.lat,
          lng: r.lng,
          image: r.image || "",
          category_type: r.category_type || null,     // ✅ top_3 | ml_high | developer
          category: r.category || "",
          score: typeof r.ml_score === "number" ? r.ml_score : r.score ?? null,
          reason: r.reason || "",
        })),
        isMlList: true,
        source: "ml",
      },
    });

  };

  /* ------------------ 스텝 조절 ------------------ */
  const canGoNext = useMemo(() => {
    switch (activeStep) {
      case 0: return loginStatus.logged_in || loginStatus.status === "bypass" || loginStatus.status === "guest";
      case 1: return [activity, activityLevel, time, season, preference].every(Boolean);
      case 2: return rounds.length > 0 && currentVotes.filter(Boolean).length === rounds.length;
      case 3: return mlRecs.length > 0;
      default: return true;
    }
  }, [activeStep, loginStatus, activity, activityLevel, time, season, preference, rounds, currentVotes, mlRecs]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  /* ======================================================================
     Desktop Layout
     ====================================================================== */
  const DesktopView = () => (
    <>
      {/* 헤더 */}
      <Card elevation={0} sx={{ mb: 4, border: `1px solid ${tone.border}`, background: `linear-gradient(120deg, ${tone.primarySoft}, #F0FDFA)` }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={800} color={tone.primary}>🗺️ WhereWeGo 설문 시스템</Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mt: 0.5 }}>JWT 토큰 기반 보안 설문·추천 테스트</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip color={loginStatus.logged_in || loginStatus.status === "bypass" ? "success" : "default"} label={(loginStatus.logged_in || loginStatus.status === "bypass") ? "로그인됨" : "로그아웃"} variant="filled" />
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
      <AnimatePresence mode="wait" initial={false}>
        {/* STEP 0 */}
        {activeStep === 0 && (
          <motion.div key="step-login" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: tone.border }}>
                  <CardHeader avatar={<LoginIcon color="primary" />} title="1. 로그인" subheader="Google / Kakao 또는 관리자(로컬) 로그인, 혹은 로그인 없이 진행" />
                  <CardContent>
                    {(loginStatus.logged_in || loginStatus.status === "bypass") ? (
                      <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                        로그인됨 — 설문: <b>{loginStatus.has_survey_data ? "완료" : "미완료"}</b>, 투표: <b>{loginStatus.has_votes ? "완료" : "미완료"}</b>
                      </Alert>
                    ) : (
                      <Alert icon={<ErrorIcon fontSize="inherit" />} severity="warning" sx={{ mb: 2 }}>
                        로그인되어 있지 않습니다.
                      </Alert>
                    )}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button type="button" startIcon={<GoogleIcon />} variant="contained" color="primary" onClick={() => (window.location.href = GOOGLE_LOGIN_URL)}>Google 로그인</Button>
                      <Button type="button" startIcon={<ChatBubbleIcon />} variant="outlined" color="primary" onClick={() => (window.location.href = KAKAO_LOGIN_URL)}>Kakao 로그인</Button>
                      <Button type="button" variant="outlined" onClick={adminBypassLogin}>관리자 로그인(로컬)</Button>
                      <Button type="button" variant="text" onClick={continueWithoutLogin}>로그인 없이 진행</Button>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1}>
                      <Button type="button" size="small" onClick={handleCheckLogin}>상태 새로고침</Button>
                      <Button type="button" size="small" variant="contained" onClick={() => setActiveStep(1)}>다음으로</Button>
                    </Stack>
                    <Button type="button" size="small" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>로그아웃</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* STEP 1 */}
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
                            {["자연풍경", "자연산림", "관람및체험", "휴양", "테마거리", "예술감상", "공연관람", "트레킹"].map((v) => (<MenuItem key={v} value={v}>{v}</MenuItem>))}
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
                            {["오전", "오후", "저녁", "밤"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>계절</InputLabel>
                          <Select label="계절" value={season} onChange={(e) => setSeason(e.target.value)}>
                            <MenuItem value=""><em>선택</em></MenuItem>
                            {["봄", "여름", "가을", "겨울"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
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
                    <Button type="button" disabled={activeStep === 0} onClick={handleBack}>뒤로</Button>
                    <Stack direction="row" spacing={1}>
                      <Button type="button" onClick={handleSurveyStatus} startIcon={<PendingIcon />}>설문 상태</Button>
                      <Button type="button" onClick={handleSubmitSurvey} variant="contained" startIcon={<SendIcon />}>설문 제출</Button>
                      <Button type="button" variant="outlined" onClick={() => setActiveStep(2)}>다음</Button>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* STEP 2 - 투표 (가로 2분할 고정, 선택 메시지 2초 후 자동 이동) */}
        {activeStep === 2 && (
          <motion.div key="step-vote" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: tone.border, overflow: "hidden" }}>
                  <CardHeader
                    avatar={<HowToVoteIcon color="primary" />}
                    title="3. 투표 (라운드 선택)"
                    subheader="추천된 두 장소 중 선호하는 곳을 선택하세요"
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {!rounds.length ? (
                      <Alert severity="info">추천을 준비하고 있어요… 잠시만요.</Alert>
                    ) : (
                      <>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 0.5 }}>
                          <Typography variant="h5" fontWeight={900}>
                            라운드 {currentRoundIdx + 1} / {rounds.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.75 }}>
                            {currentVotes[currentRoundIdx]?.choice
                              ? `현재 선택: ${currentVotes[currentRoundIdx].item_name}`
                              : "아직 선택하지 않았어요"}
                          </Typography>
                        </Stack>

                        {/* 선택 안내 메시지 (2초 표시) */}
                        <AnimatePresence>
                          {selectedMessage && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.25 }}
                            >
                              <Alert severity="success" sx={{ my: 1.5, fontWeight: 700 }}>
                                {selectedMessage}
                              </Alert>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 가로 2분할 고정: xs={6} 로 모바일에서도 좌/우 배치 */}
                        {(() => {
                          const round = rounds[currentRoundIdx] || {};
                          return (
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <BigChoiceCard
                                  label="A"
                                  place={round?.primary}
                                  selected={isSelected(currentRoundIdx, "primary", round?.primary?.name)}
                                  onSelect={() => handleSelectAndAdvance(currentRoundIdx, "primary", round?.primary)}
                                  compact={false}
                                  disabled={isAdvancing}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <BigChoiceCard
                                  label="B"
                                  place={round?.alternative}
                                  selected={isSelected(currentRoundIdx, "alternative", round?.alternative?.name)}
                                  onSelect={() => handleSelectAndAdvance(currentRoundIdx, "alternative", round?.alternative)}
                                  compact={false}
                                  disabled={isAdvancing}
                                />
                              </Grid>
                            </Grid>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        type="button"
                        startIcon={<ArrowBack />}
                        disabled={currentRoundIdx === 0 || isAdvancing}
                        onClick={() => setCurrentRoundIdx((i) => Math.max(0, i - 1))}
                      >
                        이전 라운드
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => setCurrentRoundIdx((i) => Math.min((rounds.length - 1), i + 1))}
                        disabled={currentRoundIdx >= rounds.length - 1 || isAdvancing}
                      >
                        다음 라운드
                      </Button>
                    </Stack>
                    <Button
                      type="button"
                      onClick={handleSubmitVotes}
                      variant="contained"
                      startIcon={<HowToVoteIcon />}
                      disabled={!rounds.length || isAdvancing}
                    >
                      투표 제출
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* STEP 3 */}
        {activeStep === 3 && (
          <motion.div key="step-ml" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: tone.border }}>
                  <CardHeader avatar={<ScienceIcon color="primary" />} title="4. ML 모델 추천 (20곳)" subheader="설문과 투표를 기반으로 추천" />
                  <CardActions sx={{ px: 2, pt: 0 }}>
                    <Button type="button" variant="outlined" onClick={handleMLRecs} startIcon={<ScienceIcon />}>ML 추천 받기</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button type="button" onClick={handleBack}>뒤로</Button>
                    <Button type="button" disabled={!canGoNext} variant="outlined" onClick={handleNext}>다음</Button>
                  </CardActions>
                  <CardContent sx={{ maxHeight: 420, overflow: "auto" }}>
                    {!mlRecs.length ? (
                      <Alert severity="info">아직 결과가 없습니다. “ML 추천 받기”를 눌러주세요.</Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {mlRecs.map((p, i) => (
                          <Box
                            key={`${p.id || p.item_id || p.content_id || p.ml_index || "rec"}-${i}`}
                            sx={{ p: 1.25, border: `1px solid ${tone.border}`, borderRadius: 1.5, bgcolor: tone.paper }}
                          >
                            <Typography variant="subtitle2" fontWeight={700}>
                              {i + 1}. {p.name || p.item_name || "(이름 없음)"}
                            </Typography>
                            <Typography variant="body2">🏷️ {p.category || "-"}</Typography>
                            <Typography variant="body2">
                              📊 점수: {p.ml_score != null
                                ? (typeof p.ml_score === "number" ? p.ml_score.toFixed(4) : p.ml_score)
                                : "N/A"}
                            </Typography>
                            {p.category_type && <Typography variant="body2">🧩 분류: {p.category_type}</Typography>}
                            {!!p.reason && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>🧠 추천 이유: {p.reason}</Typography>
                            )}
                          </Box>
                        ))}

                      </Stack>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pt: 0 }}>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button type="button" variant="contained" onClick={goSpotRecommend}>관광지 고르러 가기</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* STEP 4 */}
        {activeStep === 4 && (
          <motion.div key="step-admin" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: tone.border }}>
                  <CardHeader title="5. 관리 / 6. 테스트" />
                  <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: "wrap" }}>
                    <Button type="button" variant="outlined" onClick={handleSurveyStatus}>/survey/data 조회</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button type="button" onClick={handleBack}>뒤로</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  /* ======================================================================
     Mobile Layout (투표도 좌/우 배치 유지: xs=6)
     ====================================================================== */
  const MobileView = () => (
    <>
      {/* 상단 고정바 */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${tone.border}`,
          background: `linear-gradient(120deg, ${tone.primarySoft}, #F8FFFE)`
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ py: 1.25, px: 1.25 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={800} color={tone.primary} sx={{ flex: 1 }}>
              WhereWeGo
            </Typography>
            <Chip size="small" color={(loginStatus.logged_in || loginStatus.status === "bypass") ? "success" : "default"} label={(loginStatus.logged_in || loginStatus.status === "bypass") ? "로그인됨" : "로그아웃"} />
            {loading && <CircularProgress size={18} />}
          </Stack>
          <MobileStepper
            variant="progress"
            steps={steps.length}
            position="static"
            activeStep={activeStep}
            backButton={<Button type="button" size="small" onClick={handleBack} disabled={activeStep === 0}><ArrowBack fontSize="small" />뒤로</Button>}
            nextButton={<Button type="button" size="small" onClick={handleNext} disabled={!canGoNext || activeStep === steps.length - 1}>다음<ArrowForward fontSize="small" /></Button>}
            sx={{ bgcolor: "transparent", px: 0, mt: 1 }}
          />
        </Container>
      </Paper>

      {/* 본문 */}
      <Container maxWidth={false} disableGutters sx={{ py: 2, px: 1.25 }}>
        <DesktopView />
      </Container>
    </>
  );

  /* ------------------ 렌더 ------------------ */
  return (
    <Box sx={{ bgcolor: tone.subtle, minHeight: "100dvh", overflowX: "clip", width: "100%" }}>
      {finalIsMobile ? (
        <MobileView />
      ) : (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <DesktopView />
        </Container>
      )}

      {/* 공통 토스트 */}
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
        </Alert>
      </Snackbar>
    </Box>
  );
}
