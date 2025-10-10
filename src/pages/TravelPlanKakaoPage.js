// src/pages/KakaoCourseTestPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box, Paper, Typography, Stack, Button, Select, MenuItem,
  Alert, Divider, Chip, IconButton, CircularProgress, Grid, TextField
} from "@mui/material";
import DirectionsIcon from "@mui/icons-material/Directions";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import MapIcon from "@mui/icons-material/Map";
import SearchIcon from "@mui/icons-material/Search";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LandscapeIcon from "@mui/icons-material/Landscape";
import MuseumIcon from "@mui/icons-material/Museum";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────
// ENV
// ─────────────────────────────────────────────────────────────────────
const API_PREFIX =
  process.env.REACT_APP_API_PREFIX ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_PREFIX) ||
  "http://localhost:8000";
const API_BASE_URL = `${API_PREFIX.replace(/\/$/, "")}`;

const KAKAO_APPKEY =
  process.env.REACT_APP_KAKAO_MAP_APPKEY ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_KAKAO_MAP_APPKEY) ||
  "89fc5955b80f4c5ac937b020e1d7855c";

// 샘플 ObjectId 목록 (fallback)
const SAMPLE_PLACE_IDS = [
  "681891fa77e67d6ebadae358",
  "681891fa77e67d6ebadae359",
  "681891fa77e67d6ebadae35a",
  "681891fa77e67d6ebadae35b",
  "681891fa77e67d6ebadae35c",
];

// 아이콘 선택
function iconFor(place) {
  const name = (place?.name || "").toLowerCase();
  const cat = (place?.category_type || place?.category_group || "").toLowerCase();
  if (name.includes("해수욕장") || name.includes("beach")) return "🏖️";
  if (name.includes("공원")) return "🌳";
  if (name.includes("시장")) return "🐟";
  if (name.includes("사찰") || name.includes("절")) return "⛩️";
  if (name.includes("타워")) return "🗼";
  if (name.includes("대교") || name.includes("bridge")) return "🌉";
  if (name.includes("아쿠아리움")) return "🐠";
  if (name.includes("감천") || name.includes("마을") || name.includes("village")) return "🎨";
  if (cat.includes("문화")) return "🎨";
  if (cat.includes("자연")) return "🌲";
  if (cat.includes("레포츠")) return "⚽";
  if (cat.includes("쇼핑")) return "🛍️";
  if (cat.includes("음식")) return "🍽️";
  if (cat.includes("숙박")) return "🏨";
  return "📍";
}

const VEH_ICON = { BUS: "🚌", SUBWAY: "🚇", TRAIN: "🚆", TRAM: "🚊", RAIL: "🚄", FERRY: "⛴️" };
const vehicleIcon = (t) => VEH_ICON[t] || "🚍";

// HTML 태그 제거
function stripHTML(html = "") {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

// Kakao SDK 안전 로더
async function ensureKakaoMaps(appkey) {
  if (!appkey) throw new Error("Kakao appkey is missing");
  if (window.kakao?.maps) return window.kakao;

  const EXISTING_ID = "kakao-sdk";
  document.getElementById(EXISTING_ID)?.remove();

  const loadOnce = (src, timeout = 15000) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.id = EXISTING_ID;
      s.src = src.includes("autoload") ? src : `${src}?autoload=false`;
      s.async = true;
      s.defer = true;

      const timer = setTimeout(() => {
        s.remove();
        reject(new Error("Kakao SDK load timeout"));
      }, timeout);

      s.onload = () => {
        try {
          if (!window.kakao?.maps) {
            clearTimeout(timer);
            reject(new Error("Kakao SDK loaded but kakao.maps missing"));
            return;
          }
          window.kakao.maps.load(() => {
            clearTimeout(timer);
            resolve(window.kakao);
          });
        } catch (e) {
          clearTimeout(timer);
          reject(e);
        }
      };
      s.onerror = () => {
        clearTimeout(timer);
        s.remove();
        reject(new Error("Failed to load Kakao SDK"));
      };
      document.head.appendChild(s);
    });

  const base = "https://dapi.kakao.com/v2/maps/sdk.js";
  const q = `?autoload=false&appkey=${encodeURIComponent(appkey)}&libraries=services,clusterer,drawing`;
  try {
    return await loadOnce(base + q);
  } catch (e1) {
    console.warn("[KakaoSDK] https load failed -> retry protocol-relative", e1);
    return loadOnce("//dapi.kakao.com/v2/maps/sdk.js" + q);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────
export default function KakaoCourseTestPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 장소들 (DB or 전달받은 state에서 로드)
  const [places, setPlaces] = useState([]); // [{id, name, category, icon, rating?, address?, lat?, lng?}]
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState("");

  // 추천 코스
  const [presets, setPresets] = useState({
    classic: [],
    history: [],
    nature: [],
    family: [],
  });

  // 선택/검색/모드
  const [selectedNames, setSelectedNames] = useState([]); // 이름 배열
  const [nameToIdMap, setNameToIdMap] = useState({}); // { name: objectId }
  const [mode, setMode] = useState("transit");
  const [searchQuery, setSearchQuery] = useState("");

  // Kakao map
  const [sdkError, setSdkError] = useState("");
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapElRef = useRef(null);

  // 지도 그리기 핸들
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const overlaysRef = useRef([]);

  // 경로 데이터
  const [routeData, setRouteData] = useState(null);
  const [generating, setGenerating] = useState(false);

  // 지도 전체화면 토글
  const [mapFull, setMapFull] = useState(false);

  // ── 초기 로딩: (1) 라우팅 state.spots 우선 → (2) DB → (3) 샘플 → (4) 카카오맵
  useEffect(() => {
    (async () => {
      try {
        setPlacesError("");

        // ① TouristSpotRecommendPage에서 넘어온 spots 사용
        const incoming = Array.isArray(location.state?.spots) ? location.state.spots : [];
        if (incoming.length) {
          const mapped = incoming.map((s) => ({
            id: s.id || s._id,
            name: s.name || "이름 없음",
            category: s.category || "관광지",
            icon: iconFor(s) || "📍",
            rating: typeof s.rating === "number" ? s.rating : 0,
            address: s.address || "",
            lat: s.lat,
            lng: s.lng,
          }));
          const n2i = {};
          mapped.forEach((p) => (n2i[p.name] = p.id));
          setPlaces(mapped);
          setNameToIdMap(n2i);
          setupPresets(mapped);
        } else {
          // ② state가 없으면 DB에서 로딩
          await loadPlacesFromDB();
        }
      } catch (e) {
        console.error(e);
        setPlacesError(e?.message || "장소 로드 실패");
        // ③ Fallback: 샘플 ObjectId로 최소한의 목록 구성
        await loadPlacesBySampleIds();
      } finally {
        setLoadingPlaces(false);
      }

      // ④ 카카오맵 초기화
      try {
        const kakao = await ensureKakaoMaps(KAKAO_APPKEY);
        setKakaoLoaded(true);
        if (mapElRef.current) {
          mapRef.current = new kakao.maps.Map(
            mapElRef.current,
            { center: new kakao.maps.LatLng(35.1796, 129.0756), level: 8 } // 부산 중심
          );
        }
      } catch (e) {
        console.error(e);
        setSdkError(
          (e?.message || "Kakao SDK 로딩 실패") +
            "\n- 카카오 개발자 콘솔 > 내 애플리케이션 > 플랫폼 > 웹 에 현재 도메인(프로토콜/포트 포함) 등록" +
            "\n- JavaScript 키인지 확인(REST 키 X)" +
            "\n- dapi.kakao.com 차단되지 않았는지 확인"
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── DB에서 장소 로딩
  const loadPlacesFromDB = async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/simple_detail`);
    if (!res.ok) throw new Error(`API 오류: ${res.status}`);
    const all = await res.json();
    if (!Array.isArray(all) || all.length === 0) throw new Error("DB에 장소 데이터가 없습니다");

    const popular = all.slice(0, 30);
    const mapped = popular.map((p) => ({
      id: p.id || p._id,
      name: p.name || "이름 없음",
      category: p.category_group || p.category || "기타",
      icon: iconFor(p),
      rating: p.rating || 0,
      address: p.address || "",
      lat: p.lat,
      lng: p.lng,
    }));
    const n2i = {};
    mapped.forEach((p) => (n2i[p.name] = p.id));
    setPlaces(mapped);
    setNameToIdMap(n2i);
    setupPresets(mapped);
  };

  // ── Fallback: 샘플 ID로 최소 로딩
  const loadPlacesBySampleIds = async () => {
    const tmp = [];
    const n2i = {};
    for (const oid of SAMPLE_PLACE_IDS) {
      try {
        const r = await fetch(`${API_BASE_URL}/api/v1/simple_detail?query=${oid}`);
        const data = await r.json();
        if (Array.isArray(data) && data[0]) {
          const p = data[0];
          const id = p.id || p._id;
          const obj = {
            id,
            name: p.name || "장소",
            category: p.category_group || "관광지",
            icon: iconFor(p),
            rating: p.rating || 0,
            address: p.address || "",
            lat: p.lat,
            lng: p.lng,
          };
          tmp.push(obj);
          n2i[obj.name] = id;
        }
      } catch (e) {
        console.warn("샘플 로드 실패", oid, e);
      }
    }
    setPlaces(tmp);
    setNameToIdMap((prev) => ({ ...prev, ...n2i }));
    setupPresets(tmp);
  };

  // ── 추천 코스 구성 (이름 배열)
  const setupPresets = (arr) => {
    if (!arr?.length) return;
    const byName = (names) => {
      const hit = [];
      names.forEach((q) => {
        const f = arr.find((p) => p.name.includes(q) || q.includes(p.name));
        if (f) hit.push(f.name);
      });
      return hit;
    };

    // 1) 직접 매칭 시도
    let classic = byName(["해운대", "광안리", "감천"]);
    if (classic.length < 3 && arr.length >= 3) classic = arr.slice(0, 3).map((p) => p.name);

    let history = arr.length >= 6 ? arr.slice(3, 6).map((p) => p.name) : arr.slice(0, Math.min(3, arr.length)).map((p) => p.name);
    let nature = arr.length >= 9 ? arr.slice(6, 9).map((p) => p.name) : arr.slice(0, Math.min(3, arr.length)).map((p) => p.name);
    let family = arr.length >= 12 ? arr.slice(9, 12).map((p) => p.name) : arr.slice(0, Math.min(3, arr.length)).map((p) => p.name);

    setPresets({ classic, history, nature, family });
  };

  // ── 선택/해제
  const togglePlace = (name) => {
    setSelectedNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };
  const removePlace = (name) => {
    setSelectedNames((prev) => prev.filter((n) => n !== name));
  };
  const clearSelection = () => {
    setSelectedNames([]);
    setRouteData(null);
    clearMap();
  };

  // ── 추천 코스 클릭 → 자동 대중교통, 자동 경로 생성
  const loadPresetCourse = async (type) => {
    const course = presets[type] || [];
    if (!course.length) {
      if (places.length >= 3) {
        const rand = places.slice(0, Math.min(10, places.length)).sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.name);
        setSelectedNames(rand);
      } else {
        alert("아직 장소 데이터가 부족합니다.");
        return;
      }
    } else {
      setSelectedNames(course);
    }
    setMode("transit");
    setTimeout(() => generateRoute(), 300);
  };

  // ── place name → ObjectId
  const getPlaceIds = async (names) => {
    const ids = [];
    const misses = [];
    for (const nm of names) {
      // 1) 캐시
      if (nameToIdMap[nm]) {
        ids.push(nameToIdMap[nm]);
        continue;
      }
      // 2) 로컬 places
      const local = places.find((p) => p.name === nm);
      if (local?.id) {
        ids.push(local.id);
        setNameToIdMap((prev) => ({ ...prev, [nm]: local.id }));
        continue;
      }
      // 3) API 검색
      try {
        const r = await fetch(`${API_BASE_URL}/api/v1/simple_detail?query=${encodeURIComponent(nm)}`);
        if (!r.ok) throw new Error(`search ${nm} http ${r.status}`);
        const data = await r.json();
        if (Array.isArray(data) && data[0]) {
          const oid = data[0].id || data[0]._id;
          if (oid) {
            ids.push(oid);
            setNameToIdMap((prev) => ({ ...prev, [nm]: oid }));
            continue;
          }
        }
        misses.push(nm);
      } catch (e) {
        console.warn("검색 실패:", nm, e);
        misses.push(nm);
      }
    }
    if (misses.length) throw new Error(`다음 장소를 찾지 못했습니다:\n- ${misses.join("\n- ")}`);
    return ids;
  };

  // ── 지도 클리어
  const clearMap = useCallback(() => {
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    polylinesRef.current.forEach((p) => p.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    overlaysRef.current = [];
  }, []);

  // ── 지도에 표시
  const drawOnMap = useCallback(
    (data) => {
      const kakao = window.kakao;
      if (!kakao || !mapRef.current) return;
      clearMap();

      // 중심/레벨
      if (data?.center) {
        mapRef.current.setCenter(new kakao.maps.LatLng(data.center.lat, data.center.lng));
      }
      if (data?.zoom != null) {
        mapRef.current.setLevel(Number(data.zoom));
      }

      // 마커
      (data?.markers || []).forEach((m) => {
        const pos = new kakao.maps.LatLng(m.lat, m.lng);
        const marker = new kakao.maps.Marker({ position: pos, map: mapRef.current });
        const infowindow = new kakao.maps.InfoWindow({
          content: `
            <div style="padding:10px; min-width:150px;">
              <strong>${m.order}. ${m.name}</strong><br/>
              <small style="color:#666;">${m.address ?? ""}</small>
            </div>
          `,
        });
        kakao.maps.event.addListener(marker, "click", () => infowindow.open(mapRef.current, marker));
        markersRef.current.push({ marker, infowindow });
      });

      // 경로선 + 스텝 오버레이
      (data?.segments || []).forEach((seg) => {
        const path = (seg.polyline || []).map((p) => new kakao.maps.LatLng(p.lat, p.lng));
        if (path.length) {
          const polyline = new kakao.maps.Polyline({
            path,
            strokeWeight: 5,
            strokeColor: seg.color || "#667eea",
            strokeOpacity: 0.7,
            strokeStyle: "solid",
          });
          polyline.setMap(mapRef.current);
          polylinesRef.current.push(polyline);
        }
        (seg.steps || []).forEach((step, idx) => {
          const total = seg.polyline?.length || 0;
          if (!total) return;
          const midIdx = Math.floor(total * ((idx + 1) / ((seg.steps?.length || 1) + 1)));
          const mid = seg.polyline?.[midIdx] || seg.polyline?.[0];
          if (!mid) return;
          const pos = new kakao.maps.LatLng(mid.lat, mid.lng);
          let html = "";
          if (step.travel_mode === "TRANSIT" && step.transit_details) {
            const t = step.transit_details;
            html = `
              <div style="
                padding:8px 12px;background:#fff;border:2px solid ${seg.color || "#667eea"};
                border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.2);
                font-weight:bold;font-size:13px;white-space:nowrap;">
                ${vehicleIcon(t.vehicle_type)} ${t.line_short_name || t.line_name || ""}
              </div>`;
          } else if (step.travel_mode === "WALKING") {
            html = `
              <div style="
                padding:6px 10px;background:#52b788;color:#fff;border-radius:14px;
                box-shadow:0 2px 6px rgba(0,0,0,.15);font-weight:bold;font-size:12px;white-space:nowrap;">
                🚶 ${step.duration || ""}
              </div>`;
          } else return;
          const overlay = new kakao.maps.CustomOverlay({ position: pos, content: html, yAnchor: 0.5 });
          overlay.setMap(mapRef.current);
          overlaysRef.current.push(overlay);
        });
      });
    },
    [clearMap]
  );

  // ── 경로 생성
  const generateRoute = async () => {
    try {
      if (selectedNames.length < 2) {
        alert("최소 2개 이상의 장소를 선택해주세요.");
        return;
      }
      setGenerating(true);
      const placeIds = await getPlaceIds(selectedNames);
      const res = await fetch(`${API_BASE_URL}/api/v1/map/course-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: placeIds, mode }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRouteData(data);
      drawOnMap(data);
    } catch (e) {
      console.error(e);
      alert(`경로 생성 실패: ${e?.message || "unknown"}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── UI 조각: 장소 카드
  const PlaceItem = ({ place }) => {
    const selected = selectedNames.includes(place.name);
    return (
      <Paper
        onClick={() => togglePlace(place.name)}
        elevation={0}
        sx={{
          p: 1.5, mb: 1, borderRadius: 2, cursor: "pointer",
          border: "2px solid",
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: selected ? "primary.main" : "background.paper",
          color: selected ? "primary.contrastText" : "text.primary",
          transition: "0.2s",
          "&:hover": { transform: "translateX(4px)", boxShadow: selected ? 0 : 2, borderColor: "primary.main" },
          display: "flex", alignItems: "center", gap: 1.5,
        }}
      >
        <Box sx={{ fontSize: 22, width: 28, textAlign: "center" }}>{place.icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap fontWeight={700}>{place.name}</Typography>
          <Typography variant="body2" noWrap sx={{ opacity: 0.7 }}>
            {place.category}
          </Typography>
        </Box>
      </Paper>
    );
  };

  // ── UI 조각: 추천 코스 타일
  const PresetTile = ({ title, hint, icon, type }) => (
    <Paper
      onClick={() => loadPresetCourse(type)}
      elevation={0}
      sx={{
        p: 1.5, mb: 1, borderRadius: 2, border: "2px solid", borderColor: "divider",
        cursor: "pointer",
        "&:hover": { transform: "translateX(4px)", borderColor: "primary.main" },
      }}
    >
      <Typography fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        {icon} {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">{hint}</Typography>
    </Paper>
  );

  // ── 검색: 이름으로 simple_detail 조회 후 추가
  const searchAndAdd = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/v1/simple_detail?query=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        const p = data[0];
        const id = p.id || p._id;
        const nm = p.name || q;
        setNameToIdMap((prev) => ({ ...prev, [nm]: id }));
        if (!places.find((x) => x.name === nm)) {
          setPlaces((prev) => [...prev, { id, name: nm, category: p.category_group || "관광지", icon: iconFor(p) }]);
        }
        setSelectedNames((prev) => (prev.includes(nm) ? prev : [...prev, nm]));
        setSearchQuery("");
      } else {
        alert("검색 결과가 없습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const totalDist = useMemo(
    () => (routeData?.segments || []).reduce((s, v) => s + (v.distance_km || 0), 0),
    [routeData]
  );
  const totalMins = useMemo(
    () => (routeData?.segments || []).reduce((s, v) => s + (v.duration_minutes || 0), 0),
    [routeData]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* 헤더 */}
      <Paper
        sx={{
          mb: 2, borderRadius: 3, overflow: "hidden",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={800}>🗺️ 부산 여행 코스 경로 테스트</Typography>
          <Typography sx={{ opacity: 0.9, mt: 1 }}>
            관광지를 선택하고 카카오맵에서 실제 경로를 확인해보세요!
          </Typography>
        </Box>
      </Paper>

      {/* 본문: 좌(사이드바) / 우(지도) */}
      <Grid container spacing={0}>
        {/* 왼쪽 패널: 전체 스크롤 */}
        <Grid item xs={12} md={4} lg={4}>
          <Box
            sx={{
              p: 3,
              bgcolor: "#f8f9fa",
              borderRight: { md: "1px solid #dee2e6" },
              height: { md: "calc(100vh - 220px)" }, // 헤더 높이에 따라 조절
              minHeight: 700,
              overflowY: "auto", // << 전체 스크롤 포인트
            }}
          >
            {/* 이동 수단 */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>🚗 이동 수단 선택</Typography>
              <Select fullWidth size="small" value={mode} onChange={(e) => setMode(e.target.value)}>
                <MenuItem value="transit">🚇 대중교통 (추천)</MenuItem>
                <MenuItem value="driving">🚗 자동차</MenuItem>
                <MenuItem value="walking">🚶 도보</MenuItem>
              </Select>
            </Paper>

            {/* 추천 코스 */}
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                ⭐ 추천 코스 (클릭하면 자동 선택)
              </Typography>
              <PresetTile title="클래식 부산 1일 코스" hint="해운대 → 광안리 → 감천문화마을" icon={<BeachAccessIcon />} type="classic" />
              <PresetTile title="역사 문화 코스" hint="용두산공원 → 자갈치시장 → 태종대 (예시)" icon={<MuseumIcon />} type="history" />
              <PresetTile title="자연 힐링 코스" hint="태종대 → 이기대 → 송도해수욕장 (예시)" icon={<LandscapeIcon />} type="nature" />
              <PresetTile title="가족 여행 코스" hint="아쿠아리움 → 해운대 → 오륙도 (예시)" icon={<FamilyRestroomIcon />} type="family" />
            </Box>

            {/* 선택된 장소 */}
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                📍 선택된 장소 ({selectedNames.length}개)
              </Typography>
              {selectedNames.length === 0 ? (
                <Alert severity="info" sx={{ mb: 1 }}>💡 최소 2개 이상의 장소를 선택해주세요</Alert>
              ) : null}
              <Paper sx={{ p: 1.5, minHeight: 80 }}>
                {selectedNames.length === 0 ? (
                  <Typography sx={{ color: "#999", textAlign: "center" }}>장소를 선택해주세요</Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedNames.map((nm, i) => (
                      <Chip
                        key={nm}
                        label={`${i + 1}. ${nm}`}
                        onDelete={() => removePlace(nm)}
                        sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Box>

            {/* 검색 */}
            <Paper sx={{ p: 1.5, mb: 2 }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth size="small" placeholder="장소명을 입력 (예: 해운대)"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
                />
                <Button variant="contained" onClick={searchAndAdd}>추가</Button>
              </Stack>
            </Paper>

            {/* 부산 주요 관광지 or 담아온 목록 */}
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                🏛️ {Array.isArray(location.state?.spots) && location.state.spots.length
                  ? "담아온 관광지 (클릭해서 선택)"
                  : "부산 주요 관광지"}
              </Typography>
              {loadingPlaces ? (
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <CircularProgress size={22} sx={{ mr: 1 }} /> 불러오는 중...
                </Paper>
              ) : places.length === 0 ? (
                <Paper sx={{ p: 2, textAlign: "center", color: "#999" }}>장소가 없습니다</Paper>
              ) : (
                <Box>
                  {places.map((p) => (<PlaceItem key={p.id || p.name} place={p} />))}
                </Box>
              )}
              {!!placesError && <Alert severity="warning" sx={{ mt: 1 }}>{placesError}</Alert>}
            </Box>

            {/* 버튼들 */}
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth variant="contained" startIcon={<DirectionsIcon />}
                disabled={generating || selectedNames.length < 2 || !kakaoLoaded}
                onClick={generateRoute}
                sx={{ mb: 1, py: 1.2 }}
              >
                {generating ? "경로 생성 중…" : "🗺️ 경로 생성하기"}
              </Button>
              <Button fullWidth variant="outlined" startIcon={<RestartAltIcon />} onClick={clearSelection} sx={{ py: 1.2 }}>
                🔄 선택 초기화
              </Button>
            </Box>

            {/* 경로 정보 */}
            {routeData && (
              <Box id="route-info" sx={{ mb: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>📊 경로 정보</Typography>
                <Box id="route-segments">
                  {(routeData.segments || []).map((seg, idx) => (
                    <Paper
                      key={idx}
                      sx={{ p: 1.5, mb: 1, borderLeft: `5px solid ${seg.color || "#667eea"}`, borderRadius: 1 }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                        {idx + 1}. {seg.from_place} → {seg.to_place}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        📏 {seg.distance_km} km | ⏱️ {Math.round(seg.duration_minutes)}분
                      </Typography>

                      {Array.isArray(seg.steps) && seg.steps.length > 0 && (
                        <Box sx={{ p: 1, bgcolor: "#f8f9fa", borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>
                            📋 상세 경로
                          </Typography>
                          <Stack spacing={1}>
                            {seg.steps.map((st, j) => {
                              if (st.travel_mode === "TRANSIT" && st.transit_details) {
                                const t = st.transit_details;
                                return (
                                  <Paper key={j} sx={{ p: 1 }}>
                                    <Typography fontWeight={700} color="primary">
                                      {vehicleIcon(t.vehicle_type)} {t.line_short_name || t.line_name}
                                      {t.headsign ? ` (${t.headsign} 방면)` : ""}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {t.departure_stop} → {t.arrival_stop}
                                      {t.num_stops ? ` (${t.num_stops}개 정류장)` : ""} · ⏱️ {st.duration} · 📏 {st.distance}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              if (st.travel_mode === "WALKING") {
                                return (
                                  <Paper key={j} sx={{ p: 1 }}>
                                    <Typography fontWeight={700} color="success.main">🚶 도보</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {stripHTML(st.instruction || "")}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      ⏱️ {st.duration} · 📏 {st.distance}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            })}
                          </Stack>
                        </Box>
                      )}
                    </Paper>
                  ))}

                  <Alert severity="success" sx={{ mt: 1 }}>
                    <strong>📊 총 거리:</strong> {totalDist.toFixed(1)}km &nbsp;|&nbsp;
                    <strong>⏱️ 총 소요시간:</strong> {Math.round(totalMins)}분 (약 {Math.round(totalMins / 60)}시간)
                  </Alert>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>

        {/* 지도 */}
        <Grid item xs={12} md={8} lg={8}>
          <Box
            sx={{
              position: "relative",
              bgcolor: "#e9ecef",
              height: mapFull ? "calc(100vh - 100px)" : { xs: 520, md: "calc(100vh - 180px)" },
              transition: "height .2s ease",
            }}
          >
            <Box sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MapIcon />
                <Typography fontWeight={700}>지도</Typography>
                {!!routeData?.markers?.length && (
                  <Typography variant="body2" color="text.secondary">
                    · 마커 {routeData.markers.length}개 / 구간 {routeData.segments?.length || 0}개
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => setMapFull((v) => !v)} title={mapFull ? "지도 축소" : "지도 크게 보기"}>
                  {mapFull ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                <IconButton size="small" onClick={() => (setRouteData(null), clearMap())}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>
            <Divider />
            <Box
              ref={mapElRef}
              sx={{
                width: "100%",
                height: "calc(100% - 56px)", // 헤더 높이만큼 뺌
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#e9ecef",
              }}
            />
            {!kakaoLoaded && !sdkError && (
              <Box sx={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Alert severity="info" icon={<CircularProgress size={14} />}>
                  카카오맵 SDK 로딩 중…
                </Alert>
              </Box>
            )}
            {!!sdkError && (
              <Box sx={{ position: "absolute", top: 12, left: 12, right: 12 }}>
                <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{sdkError}</Alert>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
