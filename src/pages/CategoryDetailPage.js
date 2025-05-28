// src/pages/CategoryDetailPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Pagination, Button } from '@mui/material';
import { categoriesData } from '../data/categoriesData';
import allTouristSpotsData from '../data/touristData'; // 모든 관광지 데이터를 가져옵니다.
import SubCategoryTags from '../components/SubCategoryTags';
import TouristList from '../components/TouristList';
// useWishlist는 CategoryDetailPage에서 직접 사용하지 않으므로 임포트 제거 (TouristList 내부에서 사용)

const ITEMS_PER_PAGE = 10;
// WISHLIST_STORAGE_KEY와 wishlist, toggleWishlist 상태는 WishlistContext로 이동했으므로 제거

const CategoryDetailPage = ({ onSelectSubCategory }) => {
  const { categoryLabelFromUrl } = useParams();
  const navigate = useNavigate();

  const currentCategoryLabel = useMemo(() =>
    categoryLabelFromUrl ? decodeURIComponent(categoryLabelFromUrl) : undefined
    , [categoryLabelFromUrl]);

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // allTouristSpotsData 객체를 배열로 변환하여 사용합니다.
  const allTouristDataArray = useMemo(() => Object.values(allTouristSpotsData), []);

  useEffect(() => {
  setIsLoading(true);
  if (currentCategoryLabel) {
    const foundCategory = categoriesData.find(c => c.label === currentCategoryLabel);
    if (foundCategory) {
      setCategory(foundCategory);
      const existingSubCategories = foundCategory.subCategories || [];
      const hasAllCategory = existingSubCategories.some(sub => sub.label === '전체');
      let updatedSubCategories = [];
      if (!hasAllCategory) {
        updatedSubCategories = [{ label: '전체', value: 'all' }, ...existingSubCategories];
      } else {
        updatedSubCategories = existingSubCategories;
      }
      setSubCategories(updatedSubCategories);
      setSelectedSubCategory('전체');
      setCurrentPage(1);
    } else {
      setCategory(null);
      setSubCategories([]);
      console.warn(`레이블 "${currentCategoryLabel}"을 가진 카테고리를 찾을 수 없습니다.`);
    }
  } else {
    setCategory(null);
    setSubCategories([]);
  }
  setIsLoading(false);
}, [currentCategoryLabel]);
  

  const filteredTouristData = useMemo(() => {
    if (!category) return [];

    // 현재 선택된 메인 카테고리에 속하는 관광지 필터링 (parentCategory 속성 활용)
    const itemsForMainCategory = allTouristDataArray.filter(item =>
      item.parentCategory === category.label
    );

    if (selectedSubCategory === '전체') {
      // '전체' 선택 시, 해당 메인 카테고리에 속하는 모든 서브카테고리 항목 포함
      return itemsForMainCategory.filter(item =>
        subCategories.some(sc => sc.label === item.subCategory)
      );
    }
    // 특정 서브카테고리 선택 시, 해당 서브카테고리 항목만 필터링
    return itemsForMainCategory.filter(item => item.subCategory === selectedSubCategory);
  }, [category, selectedSubCategory, subCategories, allTouristDataArray]); // 의존성 배열에 allTouristDataArray 추가

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItemsOnPage = filteredTouristData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredTouristData.length / ITEMS_PER_PAGE);

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubCategorySelect = (label) => {
    setSelectedSubCategory(label);
    setCurrentPage(1);
    if (onSelectSubCategory) {
      onSelectSubCategory(label);
    }
  };

  if (isLoading) {
    return <Container maxWidth="md" sx={{ py: 6 }}><Typography>카테고리 정보를 불러오는 중...</Typography></Container>;
  }

  if (!category) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          '{currentCategoryLabel || "알 수 없는"}' 카테고리를 찾을 수 없습니다.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        여행지 #{category.label}
      </Typography>

      <SubCategoryTags
        subCategories={subCategories}
        selected={selectedSubCategory}
        onSelect={handleSubCategorySelect}
      />

      {/* TouristList에 items만 전달하고, 위시리스트 관련 로직은 TouristList 내부에서 useWishlist 훅으로 처리 */}
      <TouristList
        items={currentItemsOnPage}
      />

      {totalPages > 0 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            shape="rounded"
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default CategoryDetailPage;