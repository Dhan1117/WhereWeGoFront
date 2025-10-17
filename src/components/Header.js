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

const API_BASE = process.env.REACT_APP_API_PREFIX

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
        top: { xs: '40px', sm: '42px' },
        left: { xs: '50%', sm: '50%' }, // 항상 중앙으로 두고 transform 활용
        transform: 'translateX(-50%)',
        width: {
        xs: '150px',
        sm: 'min(600px, calc(100vw - 32px))', // 뷰포트 폭을 넘지 않게 제한
        md: '600px'
  },
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 1,
        boxShadow: 2,
        zIndex: 1000,
        color: '#000',
        maxHeight: { xs: '300px', sm: '400px' },
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
      <AppBar 
        position="fixed" 
        className="header" 
        sx={{ 
          backgroundColor: '#fff', 
          color: '#000',
          width: '100%',        // 화면 전체 너비
          left: 0,              // 왼쪽 끝에서 시작
          right: 0,             // 오른쪽 끝까지
          maxWidth: '100vw',    // 뷰포트 너비 초과 방지
          boxSizing: 'border-box'  // 패딩 포함 계산
        }}
      >
        <Toolbar 
          className="header__toolbar" 
          sx={{ 
            height: { 
              xs: '70px',   // 모바일: 70px
              sm: '74px',   // 태블릿: 74px
              md: '80px',   // 중형: 80px
              lg: '100px'   // 데스크톱: 100px
            },
            minHeight: { xs: '70px', sm: '74px', md: '80px', lg: '100px' },
            px: { xs: 1.5, sm: 2, md: 3 },
            width: '100%',           // 툴바도 전체 너비
            maxWidth: '100%',        // 최대 너비 제한
            boxSizing: 'border-box'  // 패딩 포함 계산
          }}
        >
          {/* 왼쪽 영역: 햄버거 메뉴 + 로고 */}
          <Box 
            className="header__left" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              height: '100%',
              gap: { xs: 0.5, sm: 1 },
              flexShrink: 0,  // 왼쪽 영역이 줄어들지 않도록
              zIndex: 2       // 검색창보다 위에
            }}
          >
            <IconButton 
              edge="start" 
              className="header__icon-button" 
              onClick={toggleDrawer(true)} 
              sx={{ 
                color: '#000',
                p: { xs: 0.5, sm: 0.75, md: 1 }
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.5rem', md: '1.6rem' } }} />
            </IconButton>

            <Box 
              onClick={() => navigate('/')} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer', 
                height: '100%',
                width: { 
                  xs: '70px',   // 모바일: 70px (줄임)
                  sm: '90px',   // 태블릿: 90px
                  md: '110px',  // 중형: 110px
                  lg: '130px'   // 대형: 130px
                },
                flexShrink: 0  // 로고가 줄어들지 않도록
              }}
            >
              <Box
                component="img"
                src="/WhereWeGo.PNG" 
                alt="Where We Go 로고"
                sx={{
                  height: { 
                    xs: '38px',   // 모바일: 38px (줄임)
                    sm: '48px',   // 태블릿: 48px
                    md: '65px',   // 중형: 65px
                    lg: '80px'    // 대형: 80px
                  },
                  width: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Box>

          {/* 중앙 영역: 검색창 */}
          <Box 
            className="header__center" 
            sx={{ 
              position: { xs: 'absolute', md: 'relative' },  // 모바일: 절대 위치
              left: { xs: '50%', md: 'auto' },               // 모바일: 화면 중앙
              transform: { xs: 'translateX(-50%)', md: 'none' },  // 모바일: 정확히 중앙
              flex: { xs: 0, md: 1 },                        // 모바일: flex 제거, 중형 이상: flex 사용
              display: 'flex',
              justifyContent: 'center', 
              px: { 
                xs: 0,        // 모바일: 여백 없음
                sm: 0,        // 태블릿: 여백 없음
                md: 0.5,      // 중형: 최소 여백
                lg: 1         // 대형: 최소 여백
              },
              mx: { 
                xs: 0,        // 모바일: 마진 없음
                sm: 0,        // 태블릿: 마진 없음
                md: 0.5       // 중형 이상: 최소 마진
              },
              minWidth: 0,
              overflow: 'visible',
              zIndex: 1       // 다른 요소 위에 표시
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
                width: { 
                  xs: '150px',  // 모바일: 150px (30px 감소)
                  sm: '170px',  // 태블릿: 170px (30px 감소)
                  md: '220px',  // 중형: 220px (60px 감소)
                  lg: '280px',  // 대형: 280px (70px 감소)
                  xl: '320px'   // 초대형: 320px (80px 감소)
                },
                backgroundColor: '#fff',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  fontSize: { 
                    xs: '0.75rem',    // 모바일: 작게
                    sm: '0.85rem', 
                    md: '1rem' 
                  },
                  height: { 
                    xs: '36px',   // 모바일: 적당한 높이
                    sm: '38px', 
                    md: '40px' 
                  },
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

          {/* 오른쪽 영역: 아이콘들 */}
          <Box 
            className="header__right"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.3, sm: 0.5, md: 1 },
              flexShrink: 0,  // 오른쪽 아이콘이 줄어들지 않도록
              ml: 'auto',     // 항상 오른쪽 정렬! (모바일/데스크톱 모두)
              zIndex: 2       // 검색창보다 위에
            }}
          >
            {/* 지구본 아이콘 - 태블릿 이상에서만 표시 */}
            <IconButton 
              className="header__icon-button" 
              sx={{ 
                color: '#000',
                display: { xs: 'none', sm: 'inline-flex' }, // 태블릿 이상
                p: { xs: 0.5, sm: 0.75, md: 1 }
              }}
            >
              <PublicIcon sx={{ fontSize: { sm: '1.25rem', md: '1.4rem', lg: '1.5rem' } }} />
            </IconButton>

            {/* 찜 아이콘 */}
            <IconButton 
              className="header__icon-button" 
              onClick={() => navigate('/wishlist')} 
              sx={{ 
                color: '#000',
                p: { xs: 0.3, sm: 0.4, md: 0.6 }
              }}
            >
              <FavoriteBorderIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } }} />
            </IconButton>

            {/* 로그인/프로필 아이콘 */}
            {user ? (
              <IconButton 
                className="header__icon-button" 
                sx={{ 
                  color: '#000',
                  p: { xs: 0.2, sm: 0.3, md: 0.4 }
                }} 
                onClick={toggleDrawer(true)}
              >
                <Avatar 
                  src={user.picture} 
                  alt={user.name}
                  sx={{
                    width: { xs: 24, sm: 28, md: 32, lg: 36 },
                    height: { xs: 24, sm: 28, md: 32, lg: 36 }
                  }}
                />
              </IconButton>
            ) : (
              <IconButton 
                className="header__icon-button" 
                sx={{ 
                  color: '#000',
                  p: { xs: 0.3, sm: 0.4, md: 0.6 }
                }} 
                onClick={toggleDrawer(true)}
              >
                <PersonOutlineIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } }} />
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

