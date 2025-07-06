// src/pages/CategoryDetailPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Pagination, Button } from '@mui/material';
import { categoriesData } from '../data/categoriesData';
// import SubCategoryTags from '../components/SubCategoryTags'; // 더 이상 사용하지 않을 경우 제거
// import TouristList from '../components/TouristList'; // 더 이상 사용하지 않을 경우 제거
import { busanSampleData } from '../data/busanSampleData';
import CategoryDetail from '../components/CategoryDetail'; // <<--- CategoryDetail 컴포넌트 임포트!

const ITEMS_PER_PAGE = 10;

const CategoryDetailPage = ({ onSelectSubCategory }) => {
  const { categoryLabelFromUrl } = useParams();
  const navigate = useNavigate();

  const currentCategoryLabel = useMemo(
    () => (categoryLabelFromUrl ? decodeURIComponent(categoryLabelFromUrl) : undefined),
    [categoryLabelFromUrl]
  );

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [touristData, setTouristData] = useState(busanSampleData);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('CategoryDetailPage - currentCategoryLabel (decoded):', currentCategoryLabel);
    console.log('CategoryDetailPage - categoriesData:', categoriesData);
    setIsLoading(true);
    if (currentCategoryLabel) {
      const foundCategory = categoriesData.find(c => c.label === currentCategoryLabel);
      console.log('CategoryDetailPage - 찾은 category:', foundCategory);
      if (foundCategory) {
        setCategory(foundCategory);
        const existingSubCategories = foundCategory.subCategories || [];
        console.log('CategoryDetailPage - 기존 subCategories:', existingSubCategories);
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

  // 필터링 로직 (현재 TouristList에 넘겨주는 로직은 유지하거나 필요에 따라 제거)
  const filteredTouristData = useMemo(() => {
    if (!category) return [];
    const itemsForMainCategory = touristData.filter(item =>
      item.category_group === category.label
    );
    if (selectedSubCategory === '전체') {
      return itemsForMainCategory;
    }
    return itemsForMainCategory.filter(item =>
      item.category === selectedSubCategory
    );
  }, [category, selectedSubCategory, touristData]);

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
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography>데이터 로드 중...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="error">오류 발생: {error}</Typography>
      </Container>
    );
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

      {/* 🔽🔽🔽 이 부분을 CategoryDetail 컴포넌트 렌더링으로 변경합니다. 🔽🔽🔽 */}
      {/* 이제 CategoryDetail이 SubCategoryList를 렌더링할 것입니다. */}
      <CategoryDetail
        selectedCategory={currentCategoryLabel}
        categoriesData={categoriesData}
        onSelectSubCategory={handleSubCategorySelect} // CategoryDetail이 이 함수를 받아 SubCategoryList에 넘겨줄 것입니다.
      />
      {/* 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 🔼🔼🔼 */}

      {/* 기존의 TouristList는 필요에 따라 유지하거나 제거합니다.
         만약 CategoryDetail 내에서 상세 목록을 보여줄 것이라면 필요 없을 수 있습니다. */}
      {/* <TouristList
        items={currentItemsOnPage}
      /> */}

      {/* Pagination도 TouristList와 함께 필요 여부를 판단합니다. */}
      {/* {totalPages > 0 && (
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
      )} */}
    </Container>
  );
};

export default CategoryDetailPage;