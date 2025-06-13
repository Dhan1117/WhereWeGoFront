import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Pagination, Button } from '@mui/material';
import { categoriesData } from '../data/categoriesData';
import SubCategoryTags from '../components/SubCategoryTags';
import TouristList from '../components/TouristList';
import { busanSampleData } from '../data/busanSampleData';

const ITEMS_PER_PAGE = 10;


const CategoryDetailPage = ({ onSelectSubCategory }) => {
  const { categoryLabelFromUrl } = useParams();
  const navigate = useNavigate();

  const currentCategoryLabel = useMemo(() =>
    categoryLabelFromUrl ? decodeURIComponent(categoryLabelFromUrl) : undefined,
    [categoryLabelFromUrl]
  );

  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [touristData, setTouristData] = useState(busanSampleData);
  const [isDataLoading, setIsDataLoading] = useState(false); // 불필요하므로 false로 처리
  const [error, setError] = useState(null);

  // 백엔드에서 데이터 불러오는 부분 주석처리
  /*
  useEffect(() => {
    const fetchTouristData = async () => {
      try {
        const response = await fetch('/api/tourist_spots');
        if (!response.ok) throw new Error('데이터 로드 실패');
        const data = await response.json();
        setTouristData(Object.values(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchTouristData();
  }, []);
  */

  // 카테고리 및 서브카테고리 설정
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

  // 필터링 로직
const filteredTouristData = useMemo(() => {
  if (!category) return [];
  const itemsForMainCategory = touristData.filter(item => 
    item.categoryGroup === category.label // categoryGroup으로 필터링
  );
  if (selectedSubCategory === '전체') {
    return itemsForMainCategory;
  }
  return itemsForMainCategory.filter(item => 
    item.category === selectedSubCategory // category로 서브 필터링
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

  // 로딩 및 에러 처리
  if (isLoading) { // isDataLoading은 사용하지 않음
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

      <SubCategoryTags
        subCategories={subCategories}
        selected={selectedSubCategory}
        onSelect={handleSubCategorySelect}
      />

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
