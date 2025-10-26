// src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, Divider, Avatar,
  TextField, InputAdornment, Button, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PublicIcon from '@mui/icons-material/Public';
import CloseIcon from '@mui/icons-material/Close';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddLocationIcon from '@mui/icons-material/AddLocation';

// 카테고리 아이콘 (왼쪽 코드 기준)
import PaletteIcon from '@mui/icons-material/Palette';
import MovieIcon from '@mui/icons-material/Movie';
import NatureIcon from '@mui/icons-material/Nature';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import WavesIcon from '@mui/icons-material/Waves';
import AttractionsIcon from '@mui/icons-material/Attractions';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

import { useNavigate, useLocation } from 'react-router-dom';
import './Header.scss';
import { SearchContext } from '../SearchContext';
import axios from 'axios';
import AddTouristSpotForm from './AddTouristSpotForm';

const API_BASE = process.env.REACT_APP_API_PREFIX;

const Header = ({ onSelectCategory = () => {} }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addTouristFormOpen, setAddTouristFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { recentSearches, updateSearches, removeSearch, clearAllSearches } = useContext(SearchContext);

  const categoryList = [
    { label: '공연관람',   icon: <PaletteIcon /> },
    { label: '예술 감상', icon: <PaletteIcon /> },
    { label: '관람및체험', icon: <MovieIcon /> },
    { label: '자연산림',   icon: <NatureIcon /> },
    { label: '자연풍경',   icon: <WavesIcon /> },
    { label: '테마거리',   icon: <ShoppingBagIcon /> },
    { label: '트레킹',     icon: <DirectionsWalkIcon /> },
    { label: '휴양',       icon: <AttractionsIcon /> },
  ];

  const serviceList = [
    { label: '관광지 추가', icon: <AddLocationIcon />, action: 'add-tourist' },
    { label: '추천 코스',   icon: <StarBorderIcon /> },
    { label: '인기 맛집',   icon: <StarBorderIcon /> },
    { label: '숙박 예약',   icon: <StarBorderIcon /> },
    { label: '할인 티켓',   icon: <StarBorderIcon /> },
  ];

  const liveKeywords = [
    '해운대', '광안리', '감천문화마을', '태종대', '자갈치시장',
    '부산타워', '부산시민공원', '이기대공원', '송정해수욕장', '영도다리'
  ];

  // 사용자 정보
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/v1/me`, { withCredentials: true });
        setUser(data || null);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setUser(null);
        } else {
          console.error('사용자 정보 조회 실패:', error);
          setUser(null);
        }
      }
    };
    fetchUser();
  }, []);

  // 페이지 변경 시 검색 드롭다운 닫기
  useEffect(() => setIsDropdownOpen(false), [location.pathname]);

  const handleGoogleLogin = () => { window.location.href = `${API_BASE}/api/v1/auth/google/login`; };
  const handleKakaoLogin  = () => { window.location.href = `${API_BASE}/api/v1/auth/kakao/login`;  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/v1/logout`, {}, { withCredentials: true });
      setUser(null);
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleForceLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/v1/force-logout`, {}, { withCredentials: true });
      setUser(null);
      alert('강제 로그아웃 처리되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('강제 로그아웃 실패:', error);
      alert('강제 로그아웃 중 오류가 발생했습니다.');
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  // 검색
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const performSearch = () => {
    if (!searchTerm.trim()) return;
    const q = searchTerm.trim();
    updateSearches(q);
    navigate(`/search?query=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };
  const handleSpotSelect = (spot) => {
    updateSearches(spot);
    navigate(`/search?query=${encodeURIComponent(spot)}`);
    setIsDropdownOpen(false);
  };
  const handleRemoveSearch = (index) => removeSearch(index);
  const handleClearAll = () => clearAllSearches();

  // 검색 드롭다운 (반응형 중앙 위치)
  const renderSearchDropdown = () => {
    if (!isDropdownOpen) return null;
    return (
      <Box sx={{
        position: 'absolute',
        top: { xs: '40px', sm: '42px' },
        left: { xs: '50%', sm: '50%' },
        transform: 'translateX(-50%)',
        width: { xs: '150px', sm: 'min(600px, calc(100vw - 32px))', md: '600px' },
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 1,
        boxShadow: 2,
        zIndex: 1000,
        color: '#000',
        maxHeight: { xs: '300px', sm: '400px' },
        overflowY: 'auto',
      }}>
        {/* 최근 검색어 */}
        {recentSearches.length > 0 && (
          <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
            <Typography fontWeight="bold" fontSize={14} mb={1}>최근 검색어</Typography>
            {recentSearches.map((spot, i) => (
              <Box
                key={`recent-${i}-${spot}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSpotSelect(spot)}
                sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
              >
                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot}</Typography>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveSearch(i); }} sx={{ ml: 1 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button onClick={handleClearAll} size="small">전체삭제</Button>
            </Box>
          </Box>
        )}

        {/* 실시간 인기 검색어 */}
        {liveKeywords.length > 0 && (
          <Box sx={{ p: 1 }}>
            <Typography fontWeight="bold" fontSize={14} mb={1}>실시간 인기 검색어</Typography>
            {liveKeywords.map((keyword, index) => (
              <Box
                key={`live-${index}-${keyword}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSpotSelect(keyword)}
                sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
              >
                <Typography variant="body2" sx={{ width: 20 }}>{index + 1}</Typography>
                <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ml: 1 }}>{keyword}</Typography>
                <Typography variant="body2" sx={{ color: index % 2 === 0 ? 'red' : 'blue', ml: 1 }}>
                  {index % 2 === 0 ? '▲' : '▼'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* 빈 상태 */}
        {recentSearches.length === 0 && liveKeywords.length === 0 && (
          <Box sx={{ p: 2, color: '#777', textAlign: 'center' }}>
            검색 기록 또는 실시간 인기 검색어가 없습니다.
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        className="header" 
        sx={{ 
          backgroundColor: '#fff', 
          color: '#000',
          width: '100%',
          left: 0,
          right: 0,
          maxWidth: '100vw',
          boxSizing: 'border-box',
          borderBottom: '1px solid #eee'
        }}
      >
        <Toolbar 
          className="header__toolbar" 
          sx={{ 
            height: { xs: '70px', sm: '74px', md: '80px', lg: '100px' },
            minHeight: { xs: '70px', sm: '74px', md: '80px', lg: '100px' },
            px: { xs: 1.5, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* 왼쪽: 메뉴 + 로고 */}
          <Box 
            className="header__left" 
            sx={{ 
              display: 'flex', alignItems: 'center', height: '100%',
              gap: { xs: 0.5, sm: 1 }, flexShrink: 0, zIndex: 2
            }}
          >
            <IconButton edge="start" className="header__icon-button" onClick={toggleDrawer(true)} sx={{ color: '#000', p: { xs: 0.5, sm: 0.75, md: 1 } }}>
              <MenuIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.5rem', md: '1.6rem' } }} />
            </IconButton>

            <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', height: '100%', width: { xs: '70px', sm: '90px', md: '110px', lg: '130px' }, flexShrink: 0 }}>
              <Box
                component="img"
                src="/WhereWeGo.PNG"
                alt="Where We Go 로고"
                sx={{ height: { xs: '38px', sm: '48px', md: '65px', lg: '80px' }, width: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          </Box>

          {/* 중앙: 검색 */}
          <Box
            className="header__center"
            sx={{
              position: { xs: 'absolute', md: 'relative' },
              left: { xs: '50%', md: 'auto' },
              transform: { xs: 'translateX(-50%)', md: 'none' },
              flex: { xs: 0, md: 1 },
              display: 'flex',
              justifyContent: 'center',
              px: { xs: 0, sm: 0, md: 0.5, lg: 1 },
              mx: { xs: 0, sm: 0, md: 0.5 },
              minWidth: 0,
              overflow: 'visible',
              zIndex: 1
            }}
          >
            <TextField
              placeholder="관광지를 검색해보세요"
              variant="outlined"
              size="small"
              className="header__search"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              autoComplete="off"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={performSearch} sx={{ color: '#000', p: { xs: 0.3, sm: 0.4, md: 0.5 } }}>
                      <SearchIcon sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '150px', sm: '170px', md: '220px', lg: '280px', xl: '320px' },
                backgroundColor: '#fff',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '1rem' },
                  height: { xs: '36px', sm: '38px', md: '40px' },
                  '& fieldset': { borderColor: '#ccc' },
                  '&:hover fieldset': { borderColor: '#aaa' },
                  '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
                },
                '& .MuiInputBase-input': {
                  color: '#000',
                  py: { xs: 0.4, sm: 0.6, md: 0.8 },
                  px: { xs: 0.6, sm: 0.8, md: 1.2 }
                }
              }}
            />
            {isDropdownOpen && renderSearchDropdown()}
          </Box>

          {/* 오른쪽: 아이콘 */}
          <Box
            className="header__right"
            sx={{
              display: 'flex', alignItems: 'center',
              gap: { xs: 0.3, sm: 0.5, md: 1 }, flexShrink: 0, ml: 'auto', zIndex: 2
            }}
          >
            <IconButton className="header__icon-button" sx={{ color: '#000', display: { xs: 'none', sm: 'inline-flex' }, p: { xs: 0.5, sm: 0.75, md: 1 } }}>
              <PublicIcon sx={{ fontSize: { sm: '1.25rem', md: '1.4rem', lg: '1.5rem' } }} />
            </IconButton>

            <IconButton className="header__icon-button" onClick={() => navigate('/wishlist')} sx={{ color: '#000', p: { xs: 0.3, sm: 0.4, md: 0.6 } }}>
              <FavoriteBorderIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } }} />
            </IconButton>

            {user ? (
              <IconButton className="header__icon-button" sx={{ color: '#000', p: { xs: 0.2, sm: 0.3, md: 0.4 } }} onClick={toggleDrawer(true)}>
                <Avatar src={user.picture} alt={user.name} sx={{ width: { xs: 24, sm: 28, md: 32, lg: 36 }, height: { xs: 24, sm: 28, md: 32, lg: 36 } }} />
              </IconButton>
            ) : (
              <IconButton className="header__icon-button" sx={{ color: '#000', p: { xs: 0.3, sm: 0.4, md: 0.6 } }} onClick={toggleDrawer(true)}>
                <PersonOutlineIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } }} />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 좌측 드로어 */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 280, color: '#000' }} role="presentation" onKeyDown={toggleDrawer(false)}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1 }}>
            {user ? (
              <>
                <Avatar src={user.picture} alt={user.name} />
                <Typography variant="body1" noWrap>{user.name}</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button onClick={handleLogout} size="small" variant="outlined">로그아웃</Button>
                  <Button onClick={handleForceLogout} size="small" variant="text">강제</Button>
                </Box>
              </>
            ) : (
              <>
                <Avatar sx={{ backgroundColor: '#ccc' }} />
                <Typography variant="body1">로그인</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button onClick={handleGoogleLogin} size="small" variant="outlined">Google</Button>
                  <Button onClick={handleKakaoLogin} size="small" variant="outlined">Kakao</Button>
                </Box>
              </>
            )}
          </Box>

          <Divider />

          {/* 카테고리 */}
          <Typography variant="subtitle1" sx={{ p: 2 }}>카테고리</Typography>
          <List sx={{ pt: 0 }}>
            {categoryList.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() => {
                  setDrawerOpen(false);
                  onSelectCategory(item.label);
                  navigate(`/category/${encodeURIComponent(item.label)}`);
                }}
                sx={{ px: 2, py: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}
              >
                <ListItemIcon sx={{ color: '#000', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider />

          {/* 주요 서비스 */}
          <Typography variant="subtitle1" sx={{ p: 2 }}>주요 서비스</Typography>
          <List sx={{ pt: 0 }}>
            {serviceList.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() => {
                  setDrawerOpen(false);
                  if (item.action === 'add-tourist') setAddTouristFormOpen(true);
                }}
                sx={{ px: 2, py: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}
              >
                <ListItemIcon sx={{ color: '#000', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 관광지 추가 폼 */}
      <AddTouristSpotForm
        open={addTouristFormOpen}
        onClose={() => setAddTouristFormOpen(false)}
      />
    </>
  );
};

export default Header;
