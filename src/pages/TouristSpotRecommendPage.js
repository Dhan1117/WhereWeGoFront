// src/pages/TouristSpotRecommendPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, CardMedia,
  Chip, Rating, Button, TextField, InputAdornment, Stack,
  Divider, IconButton, Alert, Skeleton,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';

import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Museum as MuseumIcon,
  AccessTime,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Psychology as AIIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// ✅ Google Maps JS API (Places)
import { useLoadScript } from '@react-google-maps/api';

// ─────────────────────────────────────────────────────────────
// 스타일
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const AIChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
  color: 'white',
  fontWeight: 'bold',
  '& .MuiChip-icon': { color: 'white' },
}));

const SelectedCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  cursor: 'default',
  borderRadius: 12,
  boxShadow: theme.shadows[1],
  transition: 'box-shadow .2s ease',
  '&:hover': { boxShadow: theme.shadows[3] }
}));

// ─────────────────────────────────────────────────────────────
// 유틸
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
const isPlaceholder = (url) => !url || url.includes('/api/placeholder');

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

// ─────────────────────────────────────────────────────────────
// 데이터 (데모)
const primaryTouristSpots = [
  {
    id: 1,
    name: '해운대 해수욕장',
    category: '해변',
    rating: 4.5,
    reviews: 1523,
    image: '/image/HaeundaeBeach.jpg',
    tags: ['해수욕', '서핑', '야경', '축제'],
    description: '부산을 대표하는 해수욕장으로 깨끗한 백사장과 다양한 해양 스포츠를 즐길 수 있습니다. 여름철에는 각종 축제와 이벤트가 열리며, 밤에는 아름다운 야경을 감상할 수 있습니다.',
    address: '부산광역시 해운대구 우동',
    openHours: '24시간 개방',
    entryFee: '무료',
    bestTime: '여름철 (6-8월)',
    aiScore: 92,
    distance: '0.5km',
    phone: '051-749-4000'
  },
  {
    id: 2,
    name: '감천문화마을',
    category: '문화',
    rating: 4.3,
    reviews: 987,
    image: '/api/placeholder/400/300',
    tags: ['포토스팟', '예술', '전망', '카페'],
    description: '한국의 마추픽추로 불리는 색채 넘치는 마을입니다. 계단식으로 이루어진 집들과 다양한 예술 작품들이 어우러져 독특한 풍경을 만들어냅니다.',
    address: '부산광역시 사하구 감내2로',
    openHours: '09:00-18:00',
    entryFee: '무료',
    bestTime: '봄, 가을 (날씨가 좋은 날)',
    aiScore: 88,
    distance: '3.2km',
    phone: '051-204-1444'
  },
  {
    id: 3,
    name: '자갈치시장',
    category: '시장',
    rating: 4.2,
    reviews: 2156,
    image: '/api/placeholder/400/300',
    tags: ['해산물', '전통시장', '맛집', '체험'],
    description: '한국 최대 규모의 수산물 시장으로 신선한 해산물을 직접 보고 구매할 수 있습니다. 2층에서는 구매한 해산물을 바로 조리해서 맛볼 수 있습니다.',
    address: '부산광역시 중구 자갈치해안로',
    openHours: '05:00-22:00',
    entryFee: '무료',
    bestTime: '오전 시간 (신선한 해산물)',
    aiScore: 85,
    distance: '2.1km',
    phone: '051-245-2594'
  },
  {
    id: 4,
    name: '광안리 해변',
    category: '해변',
    rating: 4.4,
    reviews: 1876,
    image: '/api/placeholder/400/300',
    tags: ['야경', '광안대교', '카페', '펜션'],
    description: '광안대교의 야경으로 유명한 해변입니다. 해운대보다 한적하면서도 아름다운 풍경을 자랑하며, 주변에 다양한 카페와 레스토랑이 있습니다.',
    address: '부산광역시 수영구 광안해변로',
    openHours: '24시간 개방',
    entryFee: '무료',
    bestTime: '저녁 시간 (야경 감상)',
    aiScore: 90,
    distance: '1.8km',
    phone: '051-610-4021'
  },
  {
    id: 5,
    name: '범어사',
    category: '사찰',
    rating: 4.6,
    reviews: 743,
    image: '/api/placeholder/400/300',
    tags: ['사찰', '등산', '문화재', '힐링'],
    description: '1300여 년의 역사를 가진 부산의 대표적인 사찰입니다. 금정산 자락에 위치해 있어 등산과 함께 즐길 수 있습니다.',
    address: '부산광역시 금정구 범어사로',
    openHours: '07:00-18:00',
    entryFee: '성인 3,000원',
    bestTime: '단풍철 (10-11월)',
    aiScore: 83,
    distance: '8.5km',
    phone: '051-508-3122'
  },
  {
    id: 6,
    name: '태종대',
    category: '자연',
    rating: 4.5,
    reviews: 1234,
    image: '/api/placeholder/400/300',
    tags: ['절벽', '등대', '자연', '트레킹'],
    description: '부산의 최남단에 위치한 자연공원으로 기암절벽과 울창한 숲이 어우러진 아름다운 풍경을 자랑합니다.',
    address: '부산광역시 영도구 전망로',
    openHours: '05:00-24:00',
    entryFee: '무료 (열차 이용시 별도)',
    bestTime: '봄, 가을',
    aiScore: 87,
    distance: '5.3km',
    phone: '051-405-2004'
  },
  {
    id: 7,
    name: '부산타워',
    category: '전망',
    rating: 4.1,
    reviews: 892,
    image: '/api/placeholder/400/300',
    tags: ['전망대', '야경', '용두산공원', '랜드마크'],
    description: '부산의 랜드마크인 부산타워에서는 부산 시내 전체를 한눈에 볼 수 있습니다. 용두산공원 내에 위치해 있습니다.',
    address: '부산광역시 중구 용두산길',
    openHours: '10:00-22:00',
    entryFee: '성인 8,000원',
    bestTime: '일몰 시간',
    aiScore: 79,
    distance: '2.7km',
    phone: '051-661-5000'
  },
  {
    id: 8,
    name: '해동용궁사',
    category: '사찰',
    rating: 4.4,
    reviews: 1456,
    image: '/api/placeholder/400/300',
    tags: ['바다사찰', '일출', '기도', '포토스팟'],
    description: '바다와 인접해 있는 독특한 사찰로 파도 소리를 들으며 기도할 수 있는 특별한 장소입니다. 일출 명소로도 유명합니다.',
    address: '부산광역시 기장군 용궁길',
    openHours: '04:30-19:30',
    entryFee: '무료',
    bestTime: '일출 시간 (05:30-06:30)',
    aiScore: 91,
    distance: '12.4km',
    phone: '051-722-7744'
  },
  {
    id: 9,
    name: '송도해상케이블카',
    category: '체험',
    rating: 4.3,
    reviews: 1687,
    image: '/api/placeholder/400/300',
    tags: ['케이블카', '바다뷰', '스릴', '송도'],
    description: '바다 위를 지나가는 케이블카로 부산의 아름다운 해안선을 공중에서 감상할 수 있습니다.',
    address: '부산광역시 서구 송도해변로',
    openHours: '09:00-22:00',
    entryFee: '일반캐빈 15,000원, 크리스털캐빈 20,000원',
    bestTime: '맑은 날 오후',
    aiScore: 86,
    distance: '6.8km',
    phone: '051-247-9900'
  },
  {
    id: 10,
    name: '국제시장',
    category: '시장',
    rating: 4.0,
    reviews: 2341,
    image: '/api/placeholder/400/300',
    tags: ['쇼핑', '전통시장', '먹거리', '문화'],
    description: '부산의 대표적인 전통시장으로 다양한 상품과 먹거리를 저렴하게 구매할 수 있습니다.',
    address: '부산광역시 중구 신창동',
    openHours: '09:00-20:00',
    entryFee: '무료',
    bestTime: '오후 시간',
    aiScore: 77,
    distance: '2.9km',
    phone: '051-245-7389'
  }
];

const secondaryTouristSpots = [
  {
    id: 11,
    name: '부산 아쿠아리움',
    category: '체험',
    rating: 4.0,
    reviews: 800,
    image: '/api/placeholder/400/300',
    tags: ['아쿠아리움', '물고기', '교육'],
    description: '부산 해운대에 위치한 대형 아쿠아리움으로 가족과 함께 방문하기 좋습니다.',
    address: '부산광역시 해운대구 마린시티',
    openHours: '10:00-20:00',
    entryFee: '성인 25,000원',
    bestTime: '주말, 공휴일',
    aiScore: 65,
    distance: '3.8km',
    phone: '051-123-4567'
  },
  {
    id: 12,
    name: '송정 해변',
    category: '해변',
    rating: 4.1,
    reviews: 300,
    image: '/api/placeholder/400/300',
    tags: ['해변', '서핑', '조용함'],
    description: '조용하고 한적한 해변으로 서핑 명소 중 하나입니다.',
    address: '부산광역시 해운대구 송정동',
    openHours: '24시간',
    entryFee: '무료',
    bestTime: '봄, 가을',
    aiScore: 60,
    distance: '7.1km',
    phone: '051-765-4321'
  },
  // ... 필요한 만큼 추가 ...
];

const categories = ['전체', '해변', '문화', '사찰', '시장', '자연', '전망', '체험'];

// ─────────────────────────────────────────────────────────────
// 로컬스토리지 키
const LS_SELECTED_KEY = 'tsr_selected_spots_v1';
const LS_EXPANDED_KEY = 'tsr_saved_panel_expanded_v1';

// (선택) 포토 캐시를 리로드 후에도 유지하려면 아래 키 활성화
const LS_PHOTO_CACHE_KEY = 'tsr_photo_cache_v1';

const TouristSpotRecommendPage = () => {
  // Google Places 로딩
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
    language: 'ko',
    region: 'KR',
  });

  const placesDivRef = useRef(null);
  const placesServiceRef = useRef(null);

  const ensurePlacesService = () => {
    if (!placesServiceRef.current && window.google && placesDivRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(placesDivRef.current);
    }
    return placesServiceRef.current;
  };

  // 사진 캐시 (id -> url)
  const [photoMap, setPhotoMap] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PHOTO_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  });
  const setPhoto = useCallback((id, url) => {
    setPhotoMap(prev => {
      if (prev[id] === url) return prev;
      const next = { ...prev, [id]: url };
      try { localStorage.setItem(LS_PHOTO_CACHE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [touristSpots, setTouristSpots] = useState([]);
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // 최초 로드: 추천 기본 + 담은 목록 복원
  useEffect(() => {
    setTouristSpots(primaryTouristSpots);
    try {
      const saved = localStorage.getItem(LS_SELECTED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSelectedSpots(parsed);
      }
      const exp = localStorage.getItem(LS_EXPANDED_KEY);
      if (exp !== null) setExpanded(exp === 'true');
      else if (saved && JSON.parse(saved)?.length > 0) setExpanded(true);
    } catch (_) {}
  }, []);

  // selectedSpots/expanded 변경 시 저장
  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED_KEY, JSON.stringify(selectedSpots)); } catch (_) {}
  }, [selectedSpots]);
  useEffect(() => {
    try { localStorage.setItem(LS_EXPANDED_KEY, expanded ? 'true' : 'false'); } catch (_) {}
  }, [expanded]);

  // Google Places로 사진 가져오기 (이름 → textSearch → getDetails.photos[0])
  const fetchPhotoForName = useCallback(async (id, name) => {
    if (!isLoaded || !window.google) return;
    if (photoMap[id]) return; // 이미 있음
    const svc = ensurePlacesService();
    if (!svc) return;

    const request = {
      query: `부산 ${name}`,
      location: new window.google.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
      radius: 50000,
      language: 'ko',
    };

    // 1) Text Search
    const place = await new Promise(resolve => {
      svc.textSearch(request, (results) => {
        resolve(Array.isArray(results) && results.length ? results[0] : null);
      });
    });
    if (!place?.place_id) return;

    // 2) Details (photos만 요청)
    const detail = await new Promise(resolve => {
      svc.getDetails(
        {
          placeId: place.place_id,
          language: 'ko',
          fields: ['photos'],
        },
        (d) => resolve(d || null)
      );
    });

    const url = detail?.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 900 });
    if (url) setPhoto(id, url);
  }, [isLoaded, photoMap, setPhoto]);

  // 좌측 리스트: 보이는 항목들 사진 채우기
  useEffect(() => {
    if (!isLoaded) return;
    const targets = touristSpots.slice(0, 24); // 과도한 호출 방지
    targets.forEach(s => {
      if (isPlaceholder(s.image)) fetchPhotoForName(s.id, s.name);
    });
  }, [isLoaded, touristSpots, fetchPhotoForName]);

  // 우측 담은 목록: 사진 없는 항목 보강
  useEffect(() => {
    if (!isLoaded) return;
    selectedSpots.forEach(s => {
      const needs = isPlaceholder(s.image) && !photoMap[s.id];
      if (needs) fetchPhotoForName(s.id, s.name);
    });
  }, [isLoaded, selectedSpots, photoMap, fetchPhotoForName]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const shuffledSecondary = shuffleArray(secondaryTouristSpots);
      const combined = primaryTouristSpots.concat(shuffledSecondary.slice(0, 10))
        .filter((spot, index, self) => self.findIndex(s => s.id === spot.id) === index);
      setTouristSpots(combined);
      // 담은 목록은 유지
    } catch (error) {
      console.error('추천 데이터를 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  // 일정에 추가 (중복 방지, Google 사진 있으면 함께 저장)
  const addToSelectedSpots = (spot) => {
    if (!selectedSpots.some(s => s.id === spot.id)) {
      const googlePhoto = photoMap[spot.id];
      const compact = {
        id: spot.id,
        name: spot.name,
        image: googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image,
        category: spot.category,
        rating: spot.rating,
        reviews: spot.reviews,
        address: spot.address,
        tags: spot.tags?.slice(0, 3) || [],
        distance: spot.distance,
      };
      setSelectedSpots(prev => [...prev, compact]);
      if (!expanded) setExpanded(true);
    }
  };

  const removeFromSelectedSpots = (spotId) => {
    setSelectedSpots(prev => prev.filter(s => s.id !== spotId));
  };

  const clearSelected = () => {
    setSelectedSpots([]);
  };

  // 필터링
  const filteredSpots = touristSpots.filter(spot => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      spot.name.toLowerCase().includes(q) ||
      (spot.tags || []).some(tag => tag.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === '전체' || spot.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 스켈레톤 카드
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

  return (
    <Box sx={{
      maxWidth: 1440, // ⬅ 좌우 더 넓게
      margin: '0 auto',
      p: 3,
      pt: 20,
      display: 'flex',
      gap: 3,
      alignItems: 'flex-start'
    }}>
      {/* Left: Main recommendations */}
      <Box sx={{ flex: 3 }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AIIcon sx={{ fontSize: 32, color: '#FF6B6B', mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                AI 추천 관광지 🏛️
              </Typography>
              <Typography variant="body1" color="text.secondary">
                부산 관광지 리스트
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchRecommendations}
              disabled={loading}
              sx={{
                borderColor: '#FF6B6B',
                color: '#FF6B6B',
                '&:hover': { borderColor: '#FF5252', backgroundColor: 'rgba(255, 107, 107, 0.05)' },
              }}
            >새로 추천받기</Button>
          </Box>

          <AIChip icon={<AIIcon />} label={`AI 분석 완료 - ${touristSpots.length}곳 추천`} sx={{ mb: 3 }} />

          {/* Search and Filter */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="관광지명 또는 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
              }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                color={selectedCategory === category ? 'primary' : 'default'}
                sx={{
                  backgroundColor: selectedCategory === category ? '#FF6B6B' : 'transparent',
                  color: selectedCategory === category ? '#fff' : 'inherit',
                  '&:hover': {
                    backgroundColor: selectedCategory === category ? '#FF5252' : '#f5f5f5'
                  },
                }}
              />
            ))}
          </Stack>
        </Paper>

        {loading && (
          <Grid container spacing={3}>
            {[...Array(4)].map((_, i) => <SpotSkeleton key={i} />)}
          </Grid>
        )}

        {!loading && (
          <Grid container spacing={3}>
            {filteredSpots.map(spot => {
              const isSelected = selectedSpots.some(s => s.id === spot.id);
              // Google 사진 우선 사용
              const googlePhoto = photoMap[spot.id];
              const finalImage = googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image;

              return (
                <Grid item xs={12} md={6} key={spot.id}>
                  <StyledCard
                    sx={{
                      border: isSelected ? '2px solid #FF6B6B' : 'none',
                      boxShadow: isSelected ? (theme) => theme.shadows[8] : undefined,
                      backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.1)' : 'white',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ position: 'relative', height: 200 }}>
                      {finalImage && !isPlaceholder(finalImage) ? (
                        <CardMedia
                          component="img"
                          image={finalImage}
                          alt={spot.name}
                          sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CardMedia
                          component="div"
                          sx={{
                            height: '100%',
                            backgroundColor: '#e8f4fd',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <MuseumIcon sx={{ fontSize: 60, color: '#666' }} />
                        </CardMedia>
                      )}

                      <Chip
                        label={`AI 점수 ${spot.aiScore}`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />

                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }}
                      >
                        <FavoriteIcon />
                      </IconButton>
                    </Box>

                    <CardContent>
                      {/* Spot details */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{spot.name}</Typography>
                        <IconButton size="small"><ShareIcon fontSize="small" /></IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {spot.address.split(' ').slice(0, 3).join(' ')} · {spot.distance}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating value={spot.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>{spot.rating} ({spot.reviews.toLocaleString()}개 리뷰)</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {spot.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {spot.tags.map((tag, i) => (
                          <Chip key={i} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{spot.openHours}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{spot.entryFee}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon fontSize="small" sx={{ mr: 1, color: '#FFD700' }} />
                          <Typography variant="body2" color="primary">베스트 타임: {spot.bestTime}</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={spot.category} size="small" sx={{ backgroundColor: '#f0f0f0', color: '#666' }} />
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ backgroundColor: '#FF6B6B' }}
                          onClick={() => addToSelectedSpots(spot)}
                          disabled={selectedSpots.some(s => s.id === spot.id)}
                        >
                          {selectedSpots.some(s => s.id === spot.id) ? '추가됨' : '일정에 추가'}
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
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <MuseumIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">검색 결과가 없습니다</Typography>
            <Typography variant="body2" color="text.secondary">다른 검색어나 카테고리를 선택해보세요</Typography>
          </Paper>
        )}

        {!loading && touristSpots.length === 0 && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchRecommendations}>다시 시도</Button>}>
            AI 추천 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.
          </Alert>
        )}
      </Box>

      {/* Right: 담은 관광지 리스트 - 더 넓게(글자 안 짤리게) + Google 사진 반영 */}
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(prev => !prev)}
        disableGutters
        elevation={0}
        sx={{
          width: 460,          // ⬅ 넓힘
          minWidth: 400,       // ⬅ 넓힘
          border: selectedSpots.length === 0 ? 'none' : '1px solid #ddd',
          borderRadius: 2,
          backgroundColor: selectedSpots.length === 0 ? 'transparent' : '#fafafa',
          boxShadow: 'none',
          alignSelf: 'flex-start',
          position: 'sticky',
          top: 80,
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          zIndex: 10,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
              담은 관광지 ({selectedSpots.length})
            </Typography>
            {selectedSpots.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={(e) => { e.stopPropagation(); clearSelected(); }}
              >
                전체 비우기
              </Button>
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
          {selectedSpots.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                마음에 드는 관광지를 <b>일정에 추가</b>해 보세요!
              </Typography>
            </Paper>
          ) : (
            selectedSpots.map((spot) => {
              const googlePhoto = photoMap[spot.id];
              const finalImage = googlePhoto && !isPlaceholder(googlePhoto) ? googlePhoto : spot.image;

              return (
                <SelectedCard key={spot.id}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* 썸네일 */}
                      <Box sx={{ width: 112, height: 84, borderRadius: 1.2, overflow: 'hidden', flex: '0 0 auto', bgcolor: '#eef3ff' }}>
                        {finalImage && !isPlaceholder(finalImage) ? (
                          <CardMedia
                            component="img"
                            image={finalImage}
                            alt={spot.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MuseumIcon sx={{ fontSize: 38, color: '#9aa5b1' }} />
                          </Box>
                        )}
                      </Box>

                      {/* 본문 (줄바꿈 허용: 글자 안 짤림) */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.25 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'keep-all',
                            }}
                            title={spot.name}
                          >
                            {spot.name}
                          </Typography>
                          <Chip size="small" label={spot.category} sx={{ bgcolor: '#f2f2f2', color: '#666' }} />
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                          {typeof spot.rating === 'number' && (
                            <>
                              <Rating value={spot.rating} precision={0.1} size="small" readOnly />
                              <Typography variant="caption">
                                {spot.rating} ({spot.reviews?.toLocaleString?.() || 0})
                              </Typography>
                            </>
                          )}
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            display: 'block',
                            wordBreak: 'keep-all',
                            whiteSpace: 'normal',
                          }}
                          title={spot.address}
                        >
                          {spot.address}
                        </Typography>

                        {/* 태그 */}
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                          {(spot.tags || []).slice(0, 3).map((tag, i) => (
                            <Chip key={i} label={tag} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                          ))}
                        </Stack>
                      </Box>

                      {/* 액션 */}
                      <IconButton
                        color="error"
                        onClick={() => removeFromSelectedSpots(spot.id)}
                        size="small"
                        sx={{ ml: 0.5 }}
                        aria-label={`${spot.name} 제거`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </SelectedCard>
              );
            })
          )}
        </AccordionDetails>
      </Accordion>

      {/* PlacesService가 필요로 하는 더미 컨테이너 (보이지 않음) */}
      <div ref={placesDivRef} style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }} />
      {loadError && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          Google Maps/Places 로딩 오류: API 키와 권한을 확인하세요.
        </Alert>
      )}
    </Box>
  );
};

export default TouristSpotRecommendPage;
