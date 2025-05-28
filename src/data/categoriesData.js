import React from 'react';
// Material UI 아이콘 임포트
import PaletteIcon from '@mui/icons-material/Palette'; // 문화·예술
import MovieIcon from '@mui/icons-material/Movie'; // 영화·체험
import NatureIcon from '@mui/icons-material/Nature'; // 자연·생태
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'; // 트레킹·산책
import WavesIcon from '@mui/icons-material/Waves'; // 해양·수상
import AttractionsIcon from '@mui/icons-material/Attractions'; // 테마·관광시설
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'; // 상업·소비
import PetsIcon from '@mui/icons-material/Pets'; // 동물 관련
import AcUnitIcon from '@mui/icons-material/AcUnit'; // 계절형 체험


export const categoriesData = [
  {
    label: '문화·예술',
    icon: <PaletteIcon />, // 아이콘 변경
    subCategories: [
      { label: '공연장, 연극극장', imageUrl: 'https://example.com/theater.jpg' },
      { label: '미술관', imageUrl: 'https://example.com/museum.jpg' },
      { label: '박물관', imageUrl: 'https://example.com/museum.jpg' },
      { label: '문화원', imageUrl: 'https://example.com/culture-center.jpg' },
      { label: '기념관', imageUrl: 'https://example.com/memorial.jpg' },
      { label: '과학관', imageUrl: 'https://example.com/science-museum.jpg' },
      { label: '전시관', imageUrl: 'https://example.com/exhibition-hall.jpg' },
      { label: '천문대', imageUrl: 'https://example.com/observatory.jpg' },
    ],
  },
  {
    label: '영화·체험',
    icon: <MovieIcon />, // 아이콘 변경
    subCategories: [
      { label: '영화관', imageUrl: 'https://example.com/cinema.jpg' },
      { label: 'CGV', imageUrl: 'https://example.com/cgv.jpg' },
      { label: '롯데시네마', imageUrl: 'https://example.com/lottecinema.jpg' },
      { label: '메가박스', imageUrl: 'https://example.com/megabox.jpg' },
      { label: '아쿠아리움', imageUrl: 'https://example.com/aquarium.jpg' },
      { label: '도자기, 도예촌', imageUrl: 'https://example.com/pottery.jpg' },
    ],
  },
  {
    label: '자연·생태',
    icon: <NatureIcon />, // 아이콘 변경
    subCategories: [
      { label: '산', imageUrl: 'https://example.com/mountain.jpg' },
      { label: '계곡', imageUrl: 'https://example.com/valley.jpg' },
      { label: '저수지', imageUrl: 'https://example.com/reservoir.jpg' },
      { label: '숲', imageUrl: 'https://example.com/forest.jpg' },
      { label: '강', imageUrl: 'https://example.com/river.jpg' },
      { label: '호수', imageUrl: 'https://example.com/lake.jpg' },
      { label: '자연휴양림', imageUrl: 'https://example.com/recreational-forest.jpg' },
      { label: '수목원, 식물원', imageUrl: 'https://example.com/arboretum.jpg' },
    ],
  },
  {
    label: '트레킹·산책',
    icon: <DirectionsWalkIcon />, // 아이콘 변경
    subCategories: [
      { label: '갈맷길', imageUrl: 'https://example.com/galmaet-gil.jpg' },
      { label: '금정산둘레길', imageUrl: 'https://example.com/geumjeongsan-trail.jpg' },
      { label: '봉래산둘레길', imageUrl: 'https://example.com/bongnaesan-trail.jpg' },
      { label: '해파랑길', imageUrl: 'https://example.com/haeparang-gil.jpg' },
      { label: '남파랑길', imageUrl: 'https://example.com/nampalang-gil.jpg' },
      { label: '둘레길', imageUrl: 'https://example.com/trail.jpg' },
      { label: '도보여행', imageUrl: 'https://example.com/walking-tour.jpg' },
      { label: '자전거여행', imageUrl: 'https://example.com/cycling-tour.jpg' },
      { label: '서구종단트레킹숲길', imageUrl: 'https://example.com/seogu-forest-trail.jpg' },
      { label: '무장애나눔길', imageUrl: 'https://example.com/barrier-free-trail.jpg' },
    ],
  },
  {
    label: '해양·수상',
    icon: <WavesIcon />, // 아이콘 변경
    subCategories: [
      { label: '해수욕장, 해변', imageUrl: 'https://example.com/beach.jpg' },
      { label: '워터테마파크', imageUrl: 'https://example.com/water-park.jpg' },
      { label: '방조제', imageUrl: 'https://example.com/breakwater.jpg' },
      { label: '섬', imageUrl: 'https://example.com/island.jpg' },
      { label: '섬(내륙)', imageUrl: 'https://example.com/inland-island.jpg' },
    ],
  },
  {
    label: '테마·관광시설',
    icon: <AttractionsIcon />, // 아이콘 변경
    subCategories: [
      { label: '테마거리', imageUrl: 'https://example.com/theme-street.jpg' },
      { label: '테마파크', imageUrl: 'https://example.com/theme-park.jpg' },
      { label: '관광농원', imageUrl: 'https://example.com/tourist-farm.jpg' },
      { label: '유원지', imageUrl: 'https://example.com/amusement-park.jpg' },
      { label: '온천', imageUrl: 'https://example.com/hot-spring.jpg' },
    ],
  },
  {
    label: '상업·소비',
    icon: <ShoppingBagIcon />, // 아이콘 변경
    subCategories: [
      { label: '먹자골목', imageUrl: 'https://example.com/food-alley.jpg' },
      { label: '카페거리', imageUrl: 'https://example.com/cafe-street.jpg' },
      { label: '노천매장', imageUrl: 'https://example.com/open-air-store.jpg' },
    ],
  },
  {
    label: '동물 관련',
    icon: <PetsIcon />, // 아이콘 변경
    subCategories: [
      { label: '동물원', imageUrl: 'https://example.com/zoo.jpg' },
      { label: '실내동물원', imageUrl: 'https://example.com/indoor-zoo.jpg' },
    ],
  },
  {
    label: '계절형 체험',
    icon: <AcUnitIcon />, // 아이콘 변경
    subCategories: [
      { label: '눈썰매장', imageUrl: 'https://example.com/sledding.jpg' },
      // 기타 계절형 체험 추가 가능
    ],
  },
];