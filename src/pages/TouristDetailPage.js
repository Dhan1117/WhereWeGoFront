import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Globe,
  Navigation,
  Star,
  Heart,
  Camera,
  DollarSign,
  Coffee,
  Bed,
  ChevronRight,
  Share2,
  Play,
  Wifi,
} from 'lucide-react';
import { busanSampleData } from '../data/busanSampleData';
import './TouristDetailPage.scss';
import { useWishlist } from '../contexts/WishlistContext';

const TouristDetailPage = () => {
  const { id: touristId } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  // touristData를 id로 검색 (id는 문자열이어야 함)
  const touristData = busanSampleData.find(item => item._id === touristId);


  const [isScrolled, setIsScrolled] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    console.log('TouristDetailPage 렌더링 시작');
    console.log('URL에서 가져온 touristId:', touristId);
    console.log('busanSampleData 내용:', busanSampleData);
    if (!touristData) {
      console.log('touristData를 찾을 수 없습니다! "정보 없음" 페이지 렌더링');
    } else {
      console.log('찾은 touristData:', touristData);
    }
  }, [touristId, touristData]); // touristId나 touristData가 변경될 때마다 실행


  if (!touristData) {
    return (
      <div className="tourist-detail-page not-found">
        <div className="floating-header floating-header--scrolled">
          <div className="header-content">
            <button className="back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              <span className="back-text">목록으로 돌아가기</span>
            </button>
          </div>
        </div>
        <div className="not-found-content">
          <Typography variant="h5" component="h2">
            요청하신 관광지 정보를 찾을 수 없습니다.
          </Typography>
          <button className="cta-button" onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const handleWishlistToggle = () => {
    if (isWishlisted(touristData._id)) {
      removeFromWishlist(touristData._id);
    } else {
      addToWishlist(touristData._id);
    }
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: touristData.name,
          text: touristData.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다!');
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

  const infoItems = [
    { icon: MapPin, label: "주소", value: touristData.address || touristData.region || '정보 없음' },
    { icon: Clock, label: "운영시간", value: touristData.hours || '정보 없음' },
    { icon: Phone, label: "전화번호", value: touristData.phone || '정보 없음' },
    { icon: Globe, label: "웹사이트", value: touristData.website ? <a href={`http://${touristData.website}`} target="_blank" rel="noopener noreferrer">{touristData.website}</a> : '정보 없음' },
    { icon: DollarSign, label: "입장료", value: touristData.entranceFee || '정보 없음' }
  ];

  return (
    <div className="tourist-detail-page">

      <div className={`floating-header ${isScrolled ? 'floating-header--scrolled' : 'floating-header--transparent'}`}>
        <div className="header-content">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span className="back-text">목록으로 돌아가기</span>
          </button>
          {isScrolled && (
            <div className="header-title animate-fade-in-up">
              <h1>{touristData.name}</h1>
              <div className="rating-badge">
                <Star className="w-4 h-4" />
                <span>{touristData.rating || 'N/A'}</span>
              </div>
            </div>
          )}
          <div className="header-actions">
            <button onClick={handleShare} className="action-button">
              <Share2 size={20} />
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`action-button ${isWishlisted(touristData._id) ? 'action-button--liked' : ''}`}
            >
              <Heart
                size={20}
                className="heart-icon"
                fill={isWishlisted(touristData._id) ? '#dc3545' : 'none'}
              />
            </button>
          </div>
        </div>
      </div>


      <div className="hero-section">
        <div
          className={`hero-background ${imageLoaded ? 'loaded' : ''}`}
          style={{ backgroundImage: `url(/images/${touristData._id}.jpg)` }}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="hero-overlay" />

        <div className="floating-actions">
          <button className="floating-button">
            <Camera size={20} />
          </button>
          <button className="floating-button">
            <Play size={20} />
          </button>
        </div>


        <div className="hero-content">
          <div className="content-wrapper">
            <div className="tags-container">
              <span className="category-tag">
                {touristData.category}
              </span>
              {touristData.tags?.slice(0, 4).map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="hero-title animate-fade-in-up">
              {touristData.name}
            </h1>
            <div className="hero-meta animate-fade-in-up">
              <div className="meta-item">
                <MapPin size={20} />
                <span>{touristData.address || touristData.region || '정보 없음'}</span>
              </div>
              <div className="rating-info">
                <Star className="star-icon w-5 h-5" />
                <span className="rating-score">{touristData.rating || 'N/A'}</span>
                <span className="review-count">({touristData.reviewCount ? touristData.reviewCount.toLocaleString() : 0})</span>
              </div>
            </div>
            <button className="cta-button animate-fade-in-up">
              <Navigation size={20} />
              길찾기
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="content-grid">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="content-card">
              <h2 className="card-title">
                <div className="title-icon title-icon--blue">
                  <MapPin className="text-white" size={20} />
                </div>
                관광지 소개
              </h2>
              <p className="description-text">{touristData.description || '설명이 없습니다.'}</p>
            </div>
          </div>
          <div className="sidebar animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
    
            <div className="content-card sticky-card">
              <h2 className="card-title">상세 정보</h2>
              <div className="info-list">
                {infoItems.map((item, index) => (
                  <div key={index} className="info-item">
                    <item.icon className="info-icon" size={20} />
                    <div className="info-content">
                      <p className="info-label">{item.label}</p>
                      <p className="info-value">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="map-button">
                <Navigation size={20} />
                네이버 지도로 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDetailPage;
