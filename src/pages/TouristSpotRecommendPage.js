// src/pages/TouristSpotRecommendPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Grid, Card, CardContent, CardMedia,
  Chip, Rating, Button, TextField, InputAdornment, Stack,
  Divider, IconButton, Alert, Skeleton, Accordion, AccordionSummary, AccordionDetails,
  Tooltip
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Museum as MuseumIcon,
  Refresh as RefreshIcon,
  Psychology as AIIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  PriorityHigh as PriorityHighIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useLoadScript } from "@react-google-maps/api";

// ---------- API ----------
const API_PREFIX =
  process.env.REACT_APP_API_PREFIX ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_PREFIX) ||
  "http://localhost:8000";
const API_BASE = `${API_PREFIX.replace(/\/$/, "")}/api/v1`;

// ---------- 스타일 ----------
const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  transition: "all 0.3s ease",
  cursor: "pointer",
  "&:hover": { transform: "translateY(-4px)", boxShadow: theme.shadows[8] },
}));
const AIChip = styled(Chip)(({ theme }) => ({
  background: "linear-gradient(45deg, #6366F1, #06B6D4)",
  color: "white",
  fontWeight: "bold",
  "& .MuiChip-icon": { color: "white" },
}));
const SelectedCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  cursor: "default",
  borderRadius: 12,
  boxShadow: theme.shadows[1],
  transition: "box-shadow .2s ease",
  "&:hover": { boxShadow: theme.shadows[3] }
}));

// ---------- 유틸 ----------
const isPlaceholder = (url) => !url || url.includes("/api/placeholder");
const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

// ML 점수/플래그 유틸
const getMlScoreValue = (spot) => {
  const raw =
    spot?.ml_score ?? spot?.mlScore ?? spot?.score ??
    spot?.similarity ?? spot?.similarity_score ??
    spot?.relevance ?? spot?.model_score ??
    spot?.rankScore ?? spot?.rank ?? null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};
const formatMlScore = (num) => {
  if (num == null) return null;
  if (num >= 0 && num <= 1) return `${Math.round(num * 100)}%`;
  return num.toFixed(1);
};
const isMlRecommended = (spot) => {
  const tags = (spot?.tags || []).map((t) => String(t).toLowerCase());
  return Boolean(
    getMlScoreValue(spot) != null ||
    ["ml", "ai", "ml추천", "ai추천"].some((k) => tags.includes(k)) ||
    spot?.source === "ml" || spot?.origin === "ml" || spot?.is_ml === true
  );
};
const isDevRecommended = (spot) => {
  const tags = (spot?.tags || []).map((t) => String(t));
  return Boolean(
    spot?.dev_recommended || spot?.curated ||
    spot?.source === "dev" || spot?.origin === "dev" ||
    tags.includes("개발자추천") || tags.includes("운영자추천") || tags.includes("추천")
  );
};

// (서버 wish API)
async function addWish({ user_id, place_id }) {
  const res = await fetch(`${API_BASE}/wish`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, place_id }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function removeWish({ user_id, place_id }) {
  const res = await fetch(`${API_BASE}/wish`, {
    method: "DELETE", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, place_id }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function getWishStatus({ user_id, place_id }) {
  const res = await fetch(
    `${API_BASE}/wish/status?user_id=${encodeURIComponent(user_id)}&place_id=${encodeURIComponent(place_id)}`
  );
  if (!res.ok) return { wished: false };
  const data = await res.json().catch(() => ({}));
  return { wished: Boolean(data.wished ?? data.is_wished ?? data.status ?? data.result) };
}

const categories = ["전체", "해변", "문화", "사찰", "시장", "자연", "전망", "체험"];

const TouristSpotRecommendPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userId = location.state?.user_id || location.state?.userId || "";
  const initialAttractions = Array.isArray(location.state?.attractions)
    ? location.state.attractions
    : [];
  const fromMlList = location.state?.isMlList === true || location.state?.source === "ml";

  // Google Places
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
    language: "ko",
    region: "KR",
  });
  const placesDivRef = useRef(null);
  const placesServiceRef = useRef(null);
  const ensurePlacesService = () => {
    if (!placesServiceRef.current && window.google && placesDivRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(placesDivRef.current);
    }
    return placesServiceRef.current;
  };

  // 상태
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [touristSpots, setTouristSpots] = useState(initialAttractions);
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [photoMap, setPhotoMap] = useState({});
  const [wishSet, setWishSet] = useState(new Set()); // place_id Set

  // 초기 ML 20개 반영
  useEffect(() => {
    setTouristSpots(initialAttractions);
    setExpanded(initialAttractions.length > 0);
  }, [initialAttractions]);

  // 위시 상태
  useEffect(() => {
    if (!userId || !touristSpots.length) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        touristSpots.map((s) => getWishStatus({ user_id: userId, place_id: String(s.id || s._id) }))
      );
      if (cancelled) return;
      const next = new Set();
      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value.wished) {
          const pid = String(touristSpots[idx].id || touristSpots[idx]._id);
          if (pid) next.add(pid);
        }
      });
      setWishSet(next);
    })();
    return () => { cancelled = true; };
  }, [userId, touristSpots]);

  // 사진 보강(Google)
  const setPhoto = useCallback((id, url) => {
    setPhotoMap((prev) => (prev[id] ? prev : { ...prev, [id]: url }));
  }, []);
  const fetchPhotoForName = useCallback(
    async (id, name) => {
      if (!isLoaded || !window.google) return;
      if (photoMap[id]) return;
      const svc = ensurePlacesService();
      if (!svc) return;

      const request = {
        query: `부산 ${name}`,
        location: new window.google.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
        radius: 50000,
        language: "ko",
      };
      const place = await new Promise((resolve) => {
        svc.textSearch(request, (results) =>
          resolve(Array.isArray(results) && results.length ? results[0] : null)
        );
      });
      if (!place?.place_id) return;
      const detail = await new Promise((resolve) => {
        svc.getDetails({ placeId: place.place_id, language: "ko", fields: ["photos"] }, (d) => resolve(d || null));
      });
      const url = detail?.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 900 });
      if (url) setPhoto(id, url);
    },
    [isLoaded, photoMap, setPhoto]
  );
  useEffect(() => {
    if (!isLoaded) return;
    touristSpots.slice(0, 24).forEach((s) => {
      const id = String(s.id || s._id);
      if (!id) return;
      if (isPlaceholder(s.image)) fetchPhotoForName(id, s.name);
    });
  }, [isLoaded, touristSpots, fetchPhotoForName]);

  // 새 추천(샘플)
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setLoading(false);
    }
  };

  // 위시 토글
  const toggleWish = async (spot) => {
    if (!userId) return alert("로그인이 필요합니다.");
    const place_id = String(spot.id || spot._id);
    if (!place_id) return;
    const isWished = wishSet.has(place_id);
    setWishSet((prev) => {
      const n = new Set(prev);
      isWished ? n.delete(place_id) : n.add(place_id);
      return n;
    });
    try {
      if (isWished) await removeWish({ user_id: userId, place_id });
      else await addWish({ user_id: userId, place_id });
    } catch {
      setWishSet((prev) => {
        const n = new Set(prev);
        isWished ? n.add(place_id) : n.delete(place_id);
        return n;
      });
      alert("위시 처리 실패");
    }
  };

  // 일정 담기
  const addToSelectedSpots = (spot) => {
    const id = String(spot.id || spot._id);
    if (!id) return;
    if (!selectedSpots.some((s) => String(s.id) === id)) {
      const googlePhoto = photoMap[id];
      const compact = {
        id,
        name: spot.name,
        backendId: id,
        image: googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image,
        category: spot.category,
        rating: spot.rating,
        reviews: spot.reviews,
        address: spot.address,
        tags: spot.tags?.slice(0, 3) || [],
        distance: spot.distance,
        lat: spot.lat,
        lng: spot.lng,
        ml_score: spot.ml_score ?? spot.mlScore ?? spot.score ?? null,
        source: spot.source || spot.origin || (fromMlList ? "ml" : null),
        dev_recommended: spot.dev_recommended || spot.curated || false,
      };
      setSelectedSpots((prev) => [...prev, compact]);
      if (!expanded) setExpanded(true);
    }
  };
  const removeFromSelectedSpots = (spotId) => {
    setSelectedSpots((prev) => prev.filter((s) => String(s.id) !== String(spotId)));
  };
  const clearSelected = () => setSelectedSpots([]);

  // 필터
  const filteredSpots = touristSpots.filter((spot) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      (spot.name || "").toLowerCase().includes(q) ||
      (spot.tags || []).some((tag) => (tag || "").toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "전체" || spot.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 스켈레톤
  const SpotSkeleton = () => (
    <Grid item xs={12} md={6} key="skeleton">
      <Card>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mb: 2 }} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 3 }} />
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );

  const goMakeCourse = () => {
    navigate("/travel-plan", {
      state: { user_id: userId, spots: selectedSpots },
    });
  };

  return (
    <Box sx={{ maxWidth: 1440, margin: "0 auto", p: 3, pt: 20, display: "flex", gap: 3, alignItems: "flex-start" }}>
      {/* Left */}
      <Box sx={{ flex: 3 }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AIIcon sx={{ fontSize: 32, color: "#6366F1", mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>AI 추천 관광지</Typography>
              <Typography variant="body1" color="text.secondary">ML 결과로 받은 부산 관광지 20곳</Typography>
            </Box>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchRecommendations} disabled={loading}>
              새로고침
            </Button>
          </Box>

          <AIChip icon={<AIIcon />} label={`AI 분석 완료 - ${touristSpots.length}곳`} sx={{ mb: 3 }} />

          {/* Search */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="관광지명 또는 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Filter */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "filled" : "outlined"}
                color={selectedCategory === category ? "primary" : "default"}
              />
            ))}
          </Stack>

          {/* 🔔 단 하나의 느낌표(!) 아이콘 + 툴팁 (박스 우하단) */}
          <Tooltip
            arrow
            placement="left"
            title={
              <Box sx={{ lineHeight: 1.6 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  이 페이지 사용 팁
                </Typography>
                <Typography variant="body2">
                  • 카드 이미지 좌상단의 <b>ML %</b>는 모델 점수예요.<br/>
                  • 태그 옆 <Chip size="small" label="ML 추천" color="primary" sx={{ color: "#fff" }}/> /
                  <Chip size="small" label="개발자 추천" color="success" sx={{ color: "#fff", ml: .5 }}/> 배지도 함께 확인하세요.<br/>
                  • 마음에 드는 곳은 <b>일정에 추가</b>로 담고, 우측 패널에서 <b>코스 짜기</b>로 이동!
                </Typography>
              </Box>
            }
          >
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                bgcolor: "rgba(255,255,255,0.95)",
                boxShadow: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,1)" }
              }}
              aria-label="도움말"
            >
              <PriorityHighIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>

        {loading && (
          <Grid container spacing={3}>
            {[...Array(4)].map((_, i) => (<SpotSkeleton key={i} />))}
          </Grid>
        )}

        {!loading && (
          <Grid container spacing={3}>
            {filteredSpots.map((spot) => {
              const id = String(spot.id || spot._id);
              const isSel = selectedSpots.some((s) => String(s.id) === id);
              const googlePhoto = photoMap[id];
              const finalImage = googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image;

              const mlVal = getMlScoreValue(spot);
              const mlText = formatMlScore(mlVal);
              const showMl = fromMlList || isMlRecommended(spot);
              const showDev = isDevRecommended(spot);

              return (
                <Grid item xs={12} md={6} key={id}>
                  <StyledCard
                    sx={{
                      border: isSel ? "2px solid #6366F1" : "none",
                      boxShadow: isSel ? (theme) => theme.shadows[8] : undefined,
                      backgroundColor: isSel ? "rgba(99, 102, 241, 0.06)" : "white",
                    }}
                  >
                    <Box sx={{ position: "relative", height: 200 }}>
                      {finalImage && !isPlaceholder(finalImage) ? (
                        <CardMedia component="img" image={finalImage} alt={spot.name} sx={{ height: "100%", width: "100%", objectFit: "cover" }} />
                      ) : (
                        <CardMedia
                          component="div"
                          sx={{ height: "100%", backgroundColor: "#eef3ff", display: "flex", justifyContent: "center", alignItems: "center" }}
                        >
                          <MuseumIcon sx={{ fontSize: 60, color: "#666" }} />
                        </CardMedia>
                      )}

                      {/* ML 점수 - 좌상단 (유지) */}
                      {showMl && (
                        <Chip
                          label={mlText ? `ML ${mlText}` : "ML"}
                          size="small"
                          color="primary"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            bgcolor: "rgba(99,102,241,0.95)",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        />
                      )}

                      {/* 위시 버튼 - 우상단 */}
                      <IconButton
                        sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.9)" }}
                        onClick={() => toggleWish(spot)}
                        aria-label={wishSet.has(id) ? "찜 해제" : "찜 추가"}
                      >
                        {wishSet.has(id) ? <FavoriteIcon sx={{ color: "#FF6B6B" }} /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Box>

                    <CardContent>
                      {/* 제목 */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{spot.name}</Typography>
                        <IconButton size="small"><ShareIcon fontSize="small" /></IconButton>
                      </Box>

                      {/* 주소/거리 */}
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {(spot.address || "").split(" ").slice(0, 3).join(" ")}
                          {spot.distance ? ` · ${spot.distance}` : ""}
                        </Typography>
                      </Box>

                      {/* 평점 */}
                      {typeof spot.rating === "number" && (
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <Rating value={spot.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="body2" sx={{ ml: 1 }}>{spot.rating}</Typography>
                        </Box>
                      )}

                      {/* 설명 */}
                      {spot.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {spot.description}
                        </Typography>
                      )}

                      {/* 추천 출처 Chip + 태그 */}
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                        {showMl && <Chip size="small" label="ML 추천" color="primary" sx={{ color: "#fff" }} />}
                        {showDev && <Chip size="small" label="개발자 추천" color="success" sx={{ color: "#fff" }} />}
                        {(spot.tags || []).slice(0, 3).map((tag, i) => (
                          <Chip key={i} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* 하단 액션 */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Chip label={spot.category || "미분류"} size="small" sx={{ backgroundColor: "#f0f0f0", color: "#666" }} />
                        <Button variant="contained" size="small" onClick={() => addToSelectedSpots(spot)} disabled={isSel}>
                          {isSel ? "추가됨" : "일정에 추가"}
                        </Button>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && filteredSpots.length === 0 && touristSpots.length > 0 && (
          <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
            <MuseumIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">검색 결과가 없습니다</Typography>
            <Typography variant="body2" color="text.secondary">다른 검색어나 카테고리를 선택해보세요</Typography>
          </Paper>
        )}

        {!loading && touristSpots.length === 0 && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchRecommendations}>다시 시도</Button>}>
            추천 데이터를 불러오지 못했습니다.
          </Alert>
        )}
      </Box>

      {/* Right: 담은 관광지 리스트 */}
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((prev) => !prev)}
        disableGutters elevation={0}
        sx={{
          width: 460, minWidth: 400,
          border: selectedSpots.length === 0 ? "none" : "1px solid #ddd",
          borderRadius: 2,
          backgroundColor: selectedSpots.length === 0 ? "transparent" : "#fafafa",
          boxShadow: "none",
          alignSelf: "flex-start",
          position: "sticky", top: 80,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto", zIndex: 10,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
              담은 관광지 ({selectedSpots.length})
            </Typography>
            {selectedSpots.length > 0 && (
              <Button size="small" variant="outlined" color="error" onClick={(e) => { e.stopPropagation(); clearSelected(); }}>
                전체 비우기
              </Button>
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
          {selectedSpots.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                마음에 드는 관광지를 <b>일정에 추가</b>해 보세요!
              </Typography>
            </Paper>
          ) : (
            selectedSpots.map((spot) => {
              const id = String(spot.id);
              const googlePhoto = photoMap[id];
              const finalImage = googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image;

              return (
                <SelectedCard key={id}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {/* 썸네일 */}
                      <Box sx={{ width: 112, height: 84, borderRadius: 1.2, overflow: "hidden", flex: "0 0 auto", bgcolor: "#eef3ff", position: "relative" }}>
                        {finalImage && !isPlaceholder(finalImage) ? (
                          <CardMedia component="img" image={finalImage} alt={spot.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MuseumIcon sx={{ fontSize: 38, color: "#9aa5b1" }} />
                          </Box>
                        )}
                      </Box>

                      {/* 본문 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.25 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700, lineHeight: 1.2,
                              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                              overflow: "hidden", wordBreak: "keep-all",
                            }}
                            title={spot.name}
                          >
                            {spot.name}
                          </Typography>
                          <Chip size="small" label={spot.category || "미분류"} sx={{ bgcolor: "#f2f2f2", color: "#666" }} />
                        </Box>

                        {typeof spot.rating === "number" && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                            <Rating value={spot.rating} precision={0.1} size="small" readOnly />
                            <Typography variant="caption">{spot.rating}</Typography>
                          </Stack>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block", wordBreak: "keep-all", whiteSpace: "normal" }} title={spot.address}>
                          {spot.address}
                        </Typography>
                      </Box>

                      {/* 액션 */}
                      <IconButton color="error" onClick={() => removeFromSelectedSpots(id)} size="small" sx={{ ml: 0.5 }} aria-label={`${spot.name} 제거`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </SelectedCard>
              );
            })
          )}
          <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}>
            <Button variant="outlined" color="error" onClick={clearSelected} disabled={selectedSpots.length === 0}>전체 비우기</Button>
            <Button variant="contained" onClick={goMakeCourse} disabled={selectedSpots.length === 0}>코스 짜기</Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* PlacesService 더미 */}
      <div ref={placesDivRef} style={{ width: 0, height: 0, overflow: "hidden", position: "absolute" }} />
      {loadError && (
        <Alert severity="error" sx={{ position: "fixed", bottom: 16, right: 16 }}>
          Google Maps/Places 로딩 오류: API 키와 권한을 확인하세요.
        </Alert>
      )}
    </Box>
  );
};

export default TouristSpotRecommendPage;
