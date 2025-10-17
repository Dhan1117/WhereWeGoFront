import React, { useState, useRef } from 'react';
import {
    Container,
    Box,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const RecommendationGallery = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 600px 이하
    const isTablet = useMediaQuery(theme.breakpoints.down('md')); // 900px 이하
    const [spots, setSpots] = useState([
        {
            id: 1,
            name: '해운대 해수욕장',
            location: '해운대구',
            image: '/image/HaeundaeBeach.jpg',
            bookmarked: false,
        },
        {
            id: 2,
            name: '자갈치 시장',
            location: '남포동',
            image: '/image/JagalchiMarket.jpg',
            bookmarked: false,
        },
        {
            id: 3,
            name: '태종대 공원',
            location: '영도구',
            image: '/image/Taejong-daeAmusementPark.jpg',
            bookmarked: false,
        },
        {
            id: 1,
            name: '해운대 해수욕장',
            location: '해운대구',
            image: '/image/HaeundaeBeach.jpg',
            bookmarked: false,
        },
        {
            id: 2,
            name: '자갈치 시장',
            location: '남포동',
            image: '/image/JagalchiMarket.jpg',
            bookmarked: false,
        },
        {
            id: 3,
            name: '태종대 공원',
            location: '영도구',
            image: '/image/Taejong-daeAmusementPark.jpg',
            bookmarked: false,
        },

    ]);

    const scrollRef = useRef(null);

    // 북마크 토글
    const toggleBookmark = (id) => {
        setSpots((prevSpots) =>
            prevSpots.map((spot) =>
                spot.id === id ? { ...spot, bookmarked: !spot.bookmarked } : spot
            )
        );
    };

    // 왼쪽 스크롤 (반응형)
    const handleScrollLeft = () => {
        if (scrollRef.current) {
            const scrollAmount = isMobile ? -250 : isTablet ? -280 : -330;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // 오른쪽 스크롤 (반응형)
    const handleScrollRight = () => {
        if (scrollRef.current) {
            const scrollAmount = isMobile ? 250 : isTablet ? 280 : 330;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <Container 
            maxWidth="lg"
            disableGutters
            sx={{ 
                py: { 
                    xs: 2,      // 16px
                    sm: 3,      // 24px
                    md: 4       // 32px
                },
                px: 0,
                maxWidth: '100%'
            }}
        >
            <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{
                    fontSize: {
                        xs: '1.25rem',   // 20px
                        sm: '1.5rem',    // 24px
                        md: '1.75rem'    // 28px
                    },
                    fontWeight: 600,
                    mb: { xs: 2, md: 3 },
                    px: { xs: 0, sm: 0 }
                }}
            >
                당신을 위한 오늘의 AI 맞춤 추천
            </Typography>

            <Box sx={{ position: 'relative' }}>
                {/* 왼쪽 화살표 버튼 - 태블릿 이상에서만 표시 */}
                {!isMobile && (
                    <IconButton
                        onClick={handleScrollLeft}
                        sx={{
                            position: 'absolute',
                            left: { sm: '-40px', md: '-48px' },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                            boxShadow: 1,
                            zIndex: 2,
                            width: { sm: 36, md: 40 },
                            height: { sm: 36, md: 40 },
                        }}
                    >
                        <ArrowBackIosIcon sx={{ fontSize: { sm: '1.25rem', md: '1.5rem' } }} />
                    </IconButton>
                )}

                {/* 가로 스크롤 영역 */}
                <Box
                    ref={scrollRef}
                    sx={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            height: { xs: '6px', md: '8px' },
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#ccc',
                            borderRadius: '4px',
                        },
                        // 모바일에서 스크롤 패딩
                        px: { xs: 0, sm: 0 },
                        mx: { xs: 0, sm: 0 },
                    }}
                >
                    <Grid
                        container
                        wrap="nowrap"
                        spacing={{ xs: 1.5, sm: 2 }}
                        sx={{
                            width: 'max-content',
                            px: { xs: 0, sm: 0 },
                        }}
                    >
                        {spots.map((spot, index) => (
                            <Grid
                                item
                                key={`${spot.id}-${index}`}
                                sx={{
                                    flex: '0 0 auto',
                                    width: {
                                        xs: 240,  // 모바일: 240px
                                        sm: 280,  // 태블릿: 280px
                                        md: 330,  // 데스크톱: 330px
                                    },
                                }}
                            >
                                <Card
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        borderRadius: { xs: 2, md: 3 },
                                        boxShadow: {
                                            xs: 1,
                                            sm: 2,
                                        },
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4,
                                        },
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        alt={spot.name}
                                        sx={{
                                            height: {
                                                xs: 140,  // 모바일: 140px
                                                sm: 160,  // 태블릿: 160px
                                                md: 180,  // 데스크톱: 180px
                                            },
                                            objectFit: 'cover',
                                        }}
                                        image={spot.image}
                                    />
                                    <CardContent 
                                        sx={{ 
                                            flexGrow: 1,
                                            p: { xs: 1.5, sm: 2 },
                                        }}
                                    >
                                        <Typography 
                                            variant="h6"
                                            sx={{
                                                fontSize: {
                                                    xs: '1rem',      // 16px
                                                    sm: '1.125rem',  // 18px
                                                    md: '1.25rem',   // 20px
                                                },
                                                fontWeight: 600,
                                                mb: 0.5,
                                            }}
                                        >
                                            {spot.name}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{
                                                fontSize: {
                                                    xs: '0.813rem',  // 13px
                                                    sm: '0.875rem',  // 14px
                                                },
                                            }}
                                        >
                                            {spot.location}
                                        </Typography>
                                    </CardContent>
                                    <CardActions 
                                        sx={{ 
                                            p: { xs: 1, sm: 1.5 },
                                            pt: 0,
                                        }}
                                    >
                                        <IconButton 
                                            onClick={() => toggleBookmark(spot.id)}
                                            sx={{
                                                p: { xs: 0.5, sm: 1 },
                                            }}
                                        >
                                            {spot.bookmarked ? (
                                                <Favorite 
                                                    sx={{ 
                                                        color: 'tomato',
                                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                                    }} 
                                                />
                                            ) : (
                                                <FavoriteBorder 
                                                    sx={{ 
                                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                                    }} 
                                                />
                                            )}
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* 오른쪽 화살표 버튼 - 태블릿 이상에서만 표시 */}
                {!isMobile && (
                    <IconButton
                        onClick={handleScrollRight}
                        sx={{
                            position: 'absolute',
                            right: { sm: '-40px', md: '-48px' },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                            boxShadow: 1,
                            zIndex: 2,
                            width: { sm: 36, md: 40 },
                            height: { sm: 36, md: 40 },
                        }}
                    >
                        <ArrowForwardIosIcon sx={{ fontSize: { sm: '1.25rem', md: '1.5rem' } }} />
                    </IconButton>
                )}
            </Box>
        </Container>
    );
};

export default RecommendationGallery;
