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
  Button // '홈으로 돌아가기' 버튼을 위해 추가
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite'; // 채워진 하트 아이콘 추가
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위해 추가

// 로컬 스토리지 키는 CategoryDetailPage와 동일해야 합니다!
const WISHLIST_STORAGE_KEY = 'myWishlist';

const WishlistPage = () => {
  const navigate = useNavigate();

  // 로컬 스토리지에서 위시리스트 불러오기
  const [wishlist, setWishlist] = useState(() => {
    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return storedWishlist ? JSON.parse(storedWishlist) : [];
    } catch (error) {
      console.error("WishlistPage에서 로컬 스토리지로부터 위시리스트를 파싱하는 데 실패했습니다:", error);
      return [];
    }
  });

  // 위시리스트가 변경될 때마다 로컬 스토리지에 저장
  // (이 페이지에서 직접 아이템을 제거할 수 있게 하기 위함)
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error("WishlistPage에서 로컬 스토리지에 위시리스트를 저장하는 데 실패했습니다:", error);
    }
  }, [wishlist]);

  // 위시리스트 토글 함수 (이 페이지에서는 주로 제거 기능으로 사용)
  const toggleWishlist = (touristItem) => {
    // 위시리스트에 이미 있는지 확인 (즉, 제거하려는 경우)
    if (wishlist.some(item => item.id === touristItem.id)) {
      setWishlist(wishlist.filter(item => item.id !== touristItem.id));
    }
    // 이 페이지는 위시리스트에 없는 아이템을 직접 추가하는 기능은 제공하지 않습니다.
    // 추가는 'CategoryDetailPage'에서 이루어집니다.
  };

  // 추천 여행지 (ID 추가로 ESLint 에러 해결)
  const recommendedSpots = [
    { id: 'rec-haeundae', name: '해운대', image: '/image/HaeundaeBeach.jpg' },
    { id: 'rec-gwangalli', name: '광안리', image: '/image/HaeundaeBeach.jpg' }, // 예시 이미지 경로를 정확히 확인하세요.
    { id: 'rec-gamcheon', name: '감천문화마을', image: '/image/Gamcheon.jpg' },
    { id: 'rec-taejongdae', name: '태종대', image: '/image/Taejong-daeAmusementPark.jpg' },
  ];

  const planningSpots = [
    { image: '/image/busan-food.jpg', title: '부산 맛집 지도' },
    { image: '/image/busan-metro.jpg', title: '지하철로 여행하기' },
    { image: '/image/busan-festival.jpg', title: '축제 & 행사 일정' },
  ];

  return (
    <Box sx={{ backgroundColor: '#fffaf3' }}>
      {/* 상단 Hero 이미지 + 제목 */}
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

      {/* 본문 콘텐츠 */}
      <Container maxWidth="md" sx={{ pt: 6 }}>
        <Typography variant="h6" gutterBottom>
          여행지
        </Typography>

        {/* wishlist.length에 따라 조건부 렌더링 */}
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
              onClick={() => navigate('/')} // 홈으로 이동하는 버튼
            >
              관광지 찾아보기
            </Button>
          </Box>
        ) : (
          // 위시리스트에 아이템이 있을 때 표시
          <Grid container spacing={2} sx={{ mb: 6 }}>
            {wishlist.map((spot) => (
              <Grid item xs={6} sm={3} key={spot.id}> {/* key prop은 spot.id로 고유하게 설정 */}
                <Card sx={{ position: 'relative', borderRadius: 2 }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={spot.image}
                    alt={spot.name || spot.title} // name 또는 title 사용
                  />
                  <CardContent sx={{ p: 1, pb: '8px !important', textAlign: 'center' }}>
                    <Typography fontWeight="bold">{spot.name || spot.title}</Typography> {/* name 또는 title 사용 */}
                  </CardContent>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'red', // 위시리스트 아이템은 항상 빨간색 하트
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                    onClick={() => toggleWishlist(spot)} // 클릭 시 위시리스트에서 제거
                  >
                    <FavoriteIcon /> {/* 채워진 하트 */}
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        ---

        {/* 추천 여행지 */}
        <Typography variant="h6" gutterBottom>
          추천 여행지
        </Typography>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {recommendedSpots.map((spot) => ( // map 함수의 두 번째 인덱스(i) 제거
            <Grid item xs={6} sm={3} key={spot.id}> {/* key는 spot.id만 사용 */}
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
                    // 위시리스트에 있으면 빨간 하트, 아니면 흰색 하트
                    color: wishlist.some(item => item.id === spot.id) ? 'red' : '#fff',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                  // 추천 여행지에서 좋아요 버튼을 누르면 위시리스트에 추가/제거하려면
                  // 아래 onClick 속성의 주석을 해제하세요.
                  // onClick={() => toggleWishlist(spot)}
                >
                  {wishlist.some(item => item.id === spot.id) ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>

        ---

        {/* 여행 계획하기 (기존 내용 그대로 유지) */}
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