// src/pages/WishlistPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Button
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router-dom';
import { listPlans } from '../utils/planStorage';

// 로컬 스토리지 키 (CategoryDetailPage와 동일해야 함)
const WISHLIST_STORAGE_KEY = 'myWishlist';

const WishlistPage = () => {
  const navigate = useNavigate();

  // 위시리스트(개별 스팟)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return storedWishlist ? JSON.parse(storedWishlist) : [];
    } catch (error) {
      console.error("WishlistPage: localStorage 파싱 실패:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error("WishlistPage: localStorage 저장 실패:", error);
    }
  }, [wishlist]);

  const toggleWishlist = (touristItem) => {
    if (wishlist.some((item) => item.id === touristItem.id)) {
      setWishlist(wishlist.filter((item) => item.id !== touristItem.id));
    }
  };

  // 추천 여행지 (샘플)
  const recommendedSpots = [
    { id: 'rec-haeundae', name: '해운대', image: '/image/HaeundaeBeach.jpg' },
    { id: 'rec-gwangalli', name: '광안리', image: '/image/HaeundaeBeach.jpg' },
    { id: 'rec-gamcheon', name: '감천문화마을', image: '/image/Gamcheon.jpg' },
    { id: 'rec-taejongdae', name: '태종대', image: '/image/Taejong-daeAmusementPark.jpg' },
  ];

  const planningSpots = [
    { image: '/image/busan-food.jpg', title: '부산 맛집 지도' },
    { image: '/image/busan-metro.jpg', title: '지하철로 여행하기' },
    { image: '/image/busan-festival.jpg', title: '축제 & 행사 일정' },
  ];

  // 저장된 코스 목록
  const [plans, setPlans] = useState(() => listPlans());
  useEffect(() => {
    const onFocus = () => setPlans(listPlans());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <Box sx={{ backgroundColor: '#fffaf3' }}>
      {/* 상단 Hero */}
      <Box
        sx={{
          position: 'relative',
          height: '300px',
          backgroundImage: 'url(/image/wish-bgr.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            textAlign: 'center',
            textShadow: '1px 1px 5px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            나의 위시리스트
          </Typography>
        </Box>
      </Box>

      {/* 본문 */}
      <Container maxWidth="md" sx={{ pt: 6 }}>
        {/* 여행지 위시리스트 */}
        <Typography variant="h6" gutterBottom>
          여행지
        </Typography>

        {wishlist.length === 0 ? (
          <Box
            sx={{
              backgroundColor: '#eef6f9',
              textAlign: 'center',
              borderRadius: 2,
              py: 6,
              mb: 5,
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              아직 저장된 여행지가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              관광지의 ♥ 버튼을 눌러 여행지를 추가해보세요
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={() => navigate('/')}
            >
              관광지 찾아보기
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mb: 6 }}>
            {wishlist.map((spot) => (
              <Grid item xs={6} sm={3} key={spot.id}>
                <Card sx={{ position: 'relative', borderRadius: 2 }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={spot.image}
                    alt={spot.name || spot.title}
                  />
                  <CardContent sx={{ p: 1, pb: '8px !important', textAlign: 'center' }}>
                    <Typography fontWeight="bold">{spot.name || spot.title}</Typography>
                  </CardContent>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'red',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                    onClick={() => toggleWishlist(spot)}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 내 코스(저장된 일정) */}
        <Typography variant="h6" gutterBottom sx={{ mt: 6 }}>
          내 코스
        </Typography>
        {plans.length === 0 ? (
          <Box
            sx={{
              backgroundColor: '#f4f7ff',
              textAlign: 'center',
              borderRadius: 2,
              py: 4,
              mb: 5,
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 44, color: '#90a4ae' }} />
            <Typography variant="subtitle1" sx={{ mt: 1 }}>저장된 코스가 없습니다</Typography>
            <Typography variant="body2" color="text.secondary">
              여행 페이지에서 ‘저장’ 버튼을 눌러 코스를 저장해보세요
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mb: 6 }}>
            {plans.map((p) => (
              <Grid item xs={12} sm={6} key={p.id}>
                <Card sx={{ borderRadius: 2, display: 'flex' }}>
                  <CardMedia
                    component="img"
                    image={p.cover || '/image/wish-bgr.jpg'}
                    alt={p.title}
                    sx={{ width: 140, height: 120, objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flex: 1 }}>
                    <Typography fontWeight="bold" noWrap>{p.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(p.createdAt).toLocaleString()}
                    </Typography>
                    <Box sx={{ mt: 1.2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate('/travel?planId=' + encodeURIComponent(p.id))}
                      >
                        불러와서 편집
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 추천 여행지 */}
        <Typography variant="h6" gutterBottom>
          추천 여행지
        </Typography>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {recommendedSpots.map((spot) => (
            <Grid item xs={6} sm={3} key={spot.id}>
              <Card sx={{ position: 'relative', borderRadius: 2 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={spot.image}
                  alt={spot.name}
                />
                <CardContent sx={{ p: 1, pb: '8px !important', textAlign: 'center' }}>
                  <Typography fontWeight="bold">{spot.name}</Typography>
                </CardContent>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: wishlist.some((item) => item.id === spot.id) ? 'red' : '#fff',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                  // onClick={() => toggleWishlist(spot)} // 필요 시 활성화
                >
                  {wishlist.some((item) => item.id === spot.id) ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 여행 계획하기 */}
        <Typography variant="h6" gutterBottom>
          여행 계획하기
        </Typography>
        <Grid container spacing={2}>
          {planningSpots.map((spot, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={spot.image}
                  alt={spot.title}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default WishlistPage;
