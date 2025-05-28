import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Divider, Avatar, TextField, InputAdornment, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PublicIcon from '@mui/icons-material/Public';
// 새로운 카테고리 아이콘 임포트
import PaletteIcon from '@mui/icons-material/Palette'; // 문화·예술
import MovieIcon from '@mui/icons-material/Movie'; // 영화·체험
import NatureIcon from '@mui/icons-material/Nature'; // 자연·생태
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'; // 트레킹·산책
import WavesIcon from '@mui/icons-material/Waves'; // 해양·수상
import AttractionsIcon from '@mui/icons-material/Attractions'; // 테마·관광시설
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'; // 상업·소비
import PetsIcon from '@mui/icons-material/Pets'; // 동물 관련
import AcUnitIcon from '@mui/icons-material/AcUnit'; // 계절형 체험
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.scss';
import { SearchContext } from '../SearchContext';
import axios from 'axios'; // axios 임포트 추가


const Header = ({ onSelectCategory = () => { } }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // **추가:** 사용자 정보 상태
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { recentSearches, updateSearches, removeSearch, clearAllSearches } = useContext(SearchContext);

  const handleRemoveSearch = (index) => {
    removeSearch(index);
  };

  const handleSpotSelect = (spot) => {
    updateSearches(spot);
    navigate(`/search?query=${encodeURIComponent(spot)}`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const performSearch = () => {
    if (searchTerm.trim()) {
      updateSearches(searchTerm.trim());
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  const handleClearAll = () => {
    clearAllSearches();
  };

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // **추가:** 사용자 정보 가져오는 useEffect
  useEffect(() => {
  const fetchUser = async () => {
    try {
      // axios 인스턴스 생성 또는 공통 apiClient 사용
      // 여기서는 간단히 axios.get 사용 예시 (process.env.REACT_APP_API_PREFIX 설정 가정)
      const response = await axios.get(`${process.env.REACT_APP_API_PREFIX}/auth/me`, {
        withCredentials: true // JWT 쿠키를 포함하여 요청
      });
      // if (response.ok) { // axios는 응답이 성공적이면 바로 data를 반환합니다.
      //   const userData = await response.json();
      //   setUser(userData);
      // }
      setUser(response.data); // axios는 응답 객체 안에 data 속성으로 JSON을 반환
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("사용자가 로그인되지 않았습니다 (401).");
        setUser(null); // 401 에러 시 사용자 없음으로 처리
      } else {
        console.error("사용자 정보 조회 실패:", error);
        setUser(null);
      }
    }
  };
  fetchUser();
}, []);

  // **추가:** 구글 로그인 핸들러
  const handleGoogleLogin = () => {
    // 백엔드 API의 기본 URL (예: http://localhost:8000/api/v1)
    const BACKEND_BASE_URL = process.env.REACT_APP_API_PREFIX || "http://localhost:8000/api/v1";
    window.location.href = `${BACKEND_BASE_URL}/auth/google/login`;
};
  // **추가:** 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        setUser(null); // 사용자 상태 초기화
        navigate('/'); // 로그아웃 후 홈으로 리디렉션
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // 새로운 카테고리 목록 정의
  const categoryList = [
    { label: '문화·예술', icon: <PaletteIcon /> },
    { label: '영화·체험', icon: <MovieIcon /> },
    { label: '자연·생태', icon: <NatureIcon /> },
    { label: '트레킹·산책', icon: <DirectionsWalkIcon /> },
    { label: '해양·수상', icon: <WavesIcon /> },
    { label: '테마·관광시설', icon: <AttractionsIcon /> },
    { label: '상업·소비', icon: <ShoppingBagIcon /> },
    { label: '동물 관련', icon: <PetsIcon /> },
    { label: '계절형 체험', icon: <AcUnitIcon /> },
  ];


  const serviceList = [
    { label: '추천 코스', icon: <StarBorderIcon /> },
    { label: '인기 맛집', icon: <StarBorderIcon /> },
    { label: '숙박 예약', icon: <StarBorderIcon /> },
    { label: '할인 티켓', icon: <StarBorderIcon /> },
  ];

  const liveKeywords = [
    '해운대', '광안리', '감천문화마을', '태종대', '자갈치시장',
    '부산타워', '부산시민공원', '이기대공원', '송정해수욕장', '영도다리'
  ];

  const renderSearchDropdown = () => {
    if (!isDropdownOpen) return null;

    console.log('[Header] Rendering 통합된 검색 드롭다운. Recent searches:', recentSearches, 'Live keywords:', liveKeywords);

    return (
      <Box sx={{
        position: 'absolute',
        top: '40px',
        width: '600px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 1,
        boxShadow: 2,
        zIndex: 1000,
        color: '#000',
        maxHeight: '400px',
        overflowY: 'auto',
      }}>
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
      <AppBar position="fixed" className="header" sx={{ backgroundColor: '#fff', color: '#000' }}>
        <Toolbar className="header__toolbar" sx={{ height: '100px' }}>
          <Box className="header__left" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <IconButton edge="start" className="header__icon-button" onClick={toggleDrawer(true)} sx={{ color: '#000' }}>
              <MenuIcon />
            </IconButton>

            <Box
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 1, height: '100%' }}
            >
              <img
                src="/WhereWeGo.PNG"
                alt="Where We Go 로고"
                style={{
                  height: '80px',
                  width: '120px',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>

          <Box className="header__center" sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <TextField
              placeholder="관광지를 검색해보세요"
              variant="outlined"
              size="small"
              className="header__search"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => { console.log('[Header] Search focused.'); setIsDropdownOpen(true); }}
              onBlur={() => setTimeout(() => { console.log('[Header] Search blur triggered.'); setIsDropdownOpen(false); }, 200)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              autoComplete="off"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={performSearch} sx={{ color: '#000' }}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '300px',
                backgroundColor: '#fff',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#aaa',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#000',
                }
              }}
            />
            {isDropdownOpen && renderSearchDropdown()}
          </Box>

          <Box className="header__right">
            <IconButton className="header__icon-button" sx={{ color: '#000' }}><PublicIcon /></IconButton>
            <IconButton className="header__icon-button" onClick={() => navigate('/wishlist')} sx={{ color: '#000' }}><FavoriteBorderIcon /></IconButton>
            {/* **수정:** 로그인 상태에 따라 아이콘 변경 */}
            {user ? (
              <IconButton className="header__icon-button" sx={{ color: '#000' }} onClick={toggleDrawer(true)}>
                <Avatar src={user.picture} alt={user.name} />
              </IconButton>
            ) : (
              <IconButton className="header__icon-button" sx={{ color: '#000' }} onClick={handleGoogleLogin}>
                <PersonOutlineIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250, color: '#000' }} role="presentation" onKeyDown={toggleDrawer(false)}>
          <Box sx={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
            {/* **수정:** 로그인 상태에 따라 아바타 및 로그인/로그아웃 표시 */}
            {user ? (
              <>
                <Avatar src={user.picture} alt={user.name} sx={{ marginRight: '8px' }} />
                <Typography variant="body1">{user.name}</Typography>
                <Button onClick={handleLogout} sx={{ ml: 'auto' }}>로그아웃</Button>
              </>
            ) : (
              <>
                <Avatar sx={{ marginRight: '8px', backgroundColor: '#ccc' }} />
                <Typography variant="body1">로그인</Typography>
                <Button onClick={handleGoogleLogin} sx={{ ml: 'auto' }}>구글 로그인</Button>
              </>
            )}
          </Box>
          <Divider />
          <Typography variant="subtitle1" sx={{ p: 2 }}>카테고리</Typography>
          <List>
            {categoryList.map((item) => (
              <ListItem
                button
                key={item.label}
                onClick={() => {
                  setDrawerOpen(false);
                  onSelectCategory(item.label);
                  navigate(`/category/${encodeURIComponent(item.label)}`);
                }}
                sx={{ px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
              >
                <ListItemIcon sx={{ color: '#000' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Typography variant="subtitle1" sx={{ p: 2 }}>주요 서비스</Typography>
          <List>
            {serviceList.map((item) => (
              <ListItem
                button
                key={item.label}
                onClick={toggleDrawer(false)}
                sx={{ px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
              >
                <ListItemIcon sx={{ color: '#000' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;