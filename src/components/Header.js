import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Divider, Avatar, TextField, InputAdornment, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PublicIcon from '@mui/icons-material/Public';

// 카테고리 아이콘
import PaletteIcon from '@mui/icons-material/Palette';
import MovieIcon from '@mui/icons-material/Movie';
import NatureIcon from '@mui/icons-material/Nature';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import WavesIcon from '@mui/icons-material/Waves';
import AttractionsIcon from '@mui/icons-material/Attractions';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PetsIcon from '@mui/icons-material/Pets';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from '@mui/icons-material/Close';

import { useNavigate, useLocation } from 'react-router-dom';
import './Header.scss';
import { SearchContext } from '../SearchContext';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_PREFIX || 'http://localhost:8000';

const Header = ({ onSelectCategory = () => {} }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { recentSearches, updateSearches, removeSearch, clearAllSearches } = useContext(SearchContext);

  const handleRemoveSearch = (index) => removeSearch(index);

  const handleSpotSelect = (spot) => {
    updateSearches(spot);
    navigate(`/search?query=${encodeURIComponent(spot)}`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const performSearch = () => {
    if (!searchTerm.trim()) return;
    const q = searchTerm.trim();
    updateSearches(q);
    navigate(`/search?query=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleClearAll = () => clearAllSearches();

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  useEffect(() => setIsDropdownOpen(false), [location.pathname]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // CHANGED: 공통 인증 라우터의 /api/v1/me 사용
        const { data } = await axios.get(`${API_BASE}/api/v1/me`, { withCredentials: true });
        setUser(data);
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

  // 로그인 (Provider별 라우터 유지)
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/v1/auth/google/login`;
  };
  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE}/api/v1/auth/kakao/login`;
  };

  // 로그아웃 (공통 인증 라우터)
  const handleLogout = async () => {
    try {
      // CHANGED: 공통 /api/v1/logout 사용
      await axios.post(`${API_BASE}/api/v1/logout`, {}, { withCredentials: true });
      setUser(null);
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // (선택) 강제 로그아웃: 서버에서 세션/리프레시토큰 강제 무효화
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

            <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 1, height: '100%' }}>
              <img src="/WhereWeGo.PNG" alt="Where We Go 로고" style={{ height: '80px', width: '120px', objectFit: 'contain' }} />
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
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
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
                  '& fieldset': { borderColor: '#ccc' },
                  '&:hover fieldset': { borderColor: '#aaa' },
                  '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
                },
                '& .MuiInputBase-input': { color: '#000' }
              }}
            />
            {isDropdownOpen && renderSearchDropdown()}
          </Box>

          <Box className="header__right">
            <IconButton className="header__icon-button" sx={{ color: '#000' }}><PublicIcon /></IconButton>
            <IconButton className="header__icon-button" onClick={() => navigate('/wishlist')} sx={{ color: '#000' }}><FavoriteBorderIcon /></IconButton>
            {user ? (
              <IconButton className="header__icon-button" sx={{ color: '#000' }} onClick={toggleDrawer(true)}>
                <Avatar src={user.picture} alt={user.name} />
              </IconButton>
            ) : (
              // 로그인 아이콘 클릭 시 사이드바 열어 로그인 선택
              <IconButton className="header__icon-button" sx={{ color: '#000' }} onClick={toggleDrawer(true)}>
                <PersonOutlineIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 280, color: '#000' }} role="presentation" onKeyDown={toggleDrawer(false)}>
          <Box sx={{ display: 'flex', alignItems: 'center', padding: '16px', gap: 1 }}>
            {user ? (
              <>
                <Avatar src={user.picture} alt={user.name} />
                <Typography variant="body1" noWrap>{user.name}</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button onClick={handleLogout} size="small" variant="outlined">로그아웃</Button>
                  {/* 선택: 운영/디버그용 강제 로그아웃 */}
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
            {[
              { label: '추천 코스', icon: <StarBorderIcon /> },
              { label: '인기 맛집', icon: <StarBorderIcon /> },
              { label: '숙박 예약', icon: <StarBorderIcon /> },
              { label: '할인 티켓', icon: <StarBorderIcon /> },
            ].map((item) => (
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
