import React from 'react';
import PaletteIcon from '@mui/icons-material/Palette';
import MovieIcon from '@mui/icons-material/Movie';
import NatureIcon from '@mui/icons-material/Nature';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import WavesIcon from '@mui/icons-material/Waves';
import AttractionsIcon from '@mui/icons-material/Attractions';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

export const categoriesData = [
  {
    label: '문화·예술',
    icon: <PaletteIcon />,
    subCategories: [
      { label: '공연장,연극극장' },
      { label: '전시관' },
      { label: '미술관' },
      { label: '박물관' },
      { label: '문화원' },
      { label: '기념관' },
      { label: '과학관' }
    ]
  },
  {
    label: '자연·생태',
    icon: <NatureIcon />,
    subCategories: [
      { label: '산' },
      { label: '계곡' },
      { label: '숲' },
      { label: '수목원,식물원' },
      { label: '섬' }
    ]
  },
  {
    label: '트레킹·산책',
    icon: <DirectionsWalkIcon />,
    subCategories: [
      { label: '갈맷길' },
      { label: '도보여행' },
      { label: '금정산둘레길' },
      { label: '남파랑길' },
      { label: '봉래산둘레길' },
      { label: '자전거여행' },
      { label: '무장애나눔길' }
    ]
  },
  {
    label: '해양·수상',
    icon: <WavesIcon />,
    subCategories: [
      { label: '해수욕장,해변' },
      { label: '방조제' },
      { label: '워터테마파크' }
    ]
  },
  {
    label: '테마·관광시설',
    icon: <AttractionsIcon />,
    subCategories: [
      { label: '테마거리' },
      { label: '테마파크' },
      { label: '관광농원' },
      { label: '궁궐' },
      { label: '전망대' }
    ]
  },
  {
    label: '상업·소비',
    icon: <ShoppingBagIcon />,
    subCategories: [
      { label: '먹자골목' },
      { label: '일반음식점' },
      { label: '카페' }
    ]
  },
  {
    label: '영화·체험',
    icon: <MovieIcon />,
    subCategories: [
      { label: '영화관' },
      { label: 'CGV' },
      { label: '롯데시네마' },
      { label: '메가박스' },
      { label: '도자기,도예촌' },
      { label: '아쿠아리움' }
    ]
  }
];
