import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom'; // useParams와 useNavigate 추가
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
import allTouristSpotsData from '../data/touristData'; // 변경: 모든 관광지 데이터를 가져옵니다.
import './TouristDetailPage.scss'; // Import SCSS styles
import { useWishlist } from '../contexts/WishlistContext'; // WishlistContext 추가

const TouristDetailPage = () => {
  const { touristId } = useParams(); // URL 파라미터에서 touristId를 가져옵니다.
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate 훅 사용
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist(); // 위시리스트 훅 사용

  // URL 파라미터에서 가져온 ID로 해당 관광지 데이터를 찾습니다.
  const touristData = allTouristSpotsData[touristId];

  const [isScrolled, setIsScrolled] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // touristData가 없을 경우 (예: 잘못된 ID로 접근) 처리
  if (!touristData) {
    return (
      <div className="tourist-detail-page not-found">
        <div className="floating-header floating-header--scrolled">
          <div className="header-content">
            <button className="back-button" onClick={() => navigate(-1)}> {/* 뒤로가기 */}
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
    if (isWishlisted(touristData.id)) {
      removeFromWishlist(touristData.id);
    } else {
      addToWishlist(touristData.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: touristData.title,
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
    { icon: MapPin, label: "주소", value: touristData.fullAddress },
    { icon: Clock, label: "운영시간", value: touristData.hours },
    { icon: Phone, label: "전화번호", value: touristData.phone },
    { icon: Globe, label: "웹사이트", value: touristData.website ? <a href={`http://${touristData.website}`} target="_blank" rel="noopener noreferrer">{touristData.website}</a> : '정보 없음' },
    { icon: DollarSign, label: "입장료", value: touristData.entranceFee }
  ];

  return (
    <div className="tourist-detail-page">
      {/* Floating Header */}
      <div className={`floating-header ${isScrolled ? 'floating-header--scrolled' : 'floating-header--transparent'}`}>
        <div className="header-content">
          <button className="back-button" onClick={() => navigate(-1)}> {/* 뒤로가기 */}
            <ArrowLeft size={20} />
            <span className="back-text">목록으로 돌아가기</span>
          </button>

          {isScrolled && (
            <div className="header-title animate-fade-in-up">
              <h1>{touristData.title}</h1>
              <div className="rating-badge">
                <Star className="w-4 h-4" />
                <span>{touristData.rating}</span>
              </div>
            </div>
          )}

          <div className="header-actions">
            <button onClick={handleShare} className="action-button">
              <Share2 size={20} />
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`action-button ${isWishlisted(touristData.id) ? 'action-button--liked' : ''}`}
            >
              <Heart
                size={20}
                className="heart-icon"
                fill={isWishlisted(touristData.id) ? '#dc3545' : 'none'} // 위시리스트 상태에 따라 하트 색상 변경
              />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <div
          className={`hero-background ${imageLoaded ? 'loaded' : ''}`}
          style={{ backgroundImage: `url(${touristData.image})` }}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="hero-overlay" />

        {/* Floating Action Buttons */}
        <div className="floating-actions">
          <button className="floating-button">
            <Camera size={20} />
          </button>
          <button className="floating-button">
            <Play size={20} />
          </button>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="content-wrapper">
            <div className="tags-container">
              <span className="category-tag">
                {touristData.subCategory}
              </span>
              {touristData.tags.slice(0, 4).map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="hero-title animate-fade-in-up">
              {touristData.title}
            </h1>

            <div className="hero-meta animate-fade-in-up">
              <div className="meta-item">
                <MapPin size={20} />
                <span>{touristData.location}</span>
              </div>
              <div className="rating-info">
                <Star className="star-icon w-5 h-5" />
                <span className="rating-score">{touristData.rating}</span>
                <span className="review-count">({touristData.reviewCount.toLocaleString()})</span>
              </div>
            </div>

            <button className="cta-button animate-fade-in-up">
              <Navigation size={20} />
              길찾기
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          {/* Left Column */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Description */}
            <div className="content-card">
              <h2 className="card-title">
                <div className="title-icon title-icon--blue">
                  <MapPin className="text-white" size={20} />
                </div>
                관광지 소개
              </h2>
              <p className="description-text">{touristData.description}</p>
            </div>

            {/* Gallery */}
            {touristData.gallery && touristData.gallery.length > 0 && (
              <div className="content-card">
                <h2 className="card-title">
                  <div className="title-icon title-icon--purple">
                    <Camera className="text-white" size={20} />
                  </div>
                  사진 갤러리
                </h2>
                <div className="gallery-grid">
                  {touristData.gallery.map((img, index) => (
                    <div
                      key={index}
                      className="gallery-item"
                      // onClick={() => setActiveGalleryIndex(index)} // 갤러리 뷰어 기능 추가 시 사용
                    >
                      <img
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="gallery-image"
                      />
                      <div className="gallery-overlay">
                        <Camera className="camera-icon" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {touristData.facilities && touristData.facilities.length > 0 && (
              <div className="content-card">
                <h2 className="card-title">
                  <div className="title-icon title-icon--green">
                    <Wifi className="text-white" size={20} />
                  </div>
                  편의 시설
                </h2>
                <div className="facilities-grid">
                  {touristData.facilities.map((facility, index) => (
                    <div key={index} className="facility-item">
                      <div className="facility-dot"></div>
                      <span className="facility-name">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Attractions */}
            {touristData.nearbyAttractions && touristData.nearbyAttractions.length > 0 && (
              <div className="content-card">
                <h2 className="card-title">
                  <div className="title-icon title-icon--orange">
                    <MapPin className="text-white" size={20} />
                  </div>
                  주변 관광지
                </h2>
                <div className="nearby-grid">
                  {touristData.nearbyAttractions.map((place) => (
                    <div key={place.id} className="nearby-item">
                      <div className="nearby-content">
                        <img
                          src={place.image}
                          alt={place.title}
                          className="nearby-image"
                        />
                        <div className="nearby-info">
                          <h3 className="nearby-title">{place.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="nearby-subtitle">{place.distance}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">{place.rating}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="chevron-icon" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="sidebar animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
            {/* Info Card */}
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

            {/* Nearby Restaurants */}
            {touristData.nearbyRestaurants && touristData.nearbyRestaurants.length > 0 && (
              <div className="content-card">
                <h2 className="card-title">
                  <div className="title-icon title-icon--orange">
                    <Coffee className="text-white" size={20} />
                  </div>
                  주변 맛집
                </h2>

                <div className="list-container">
                  {touristData.nearbyRestaurants.map((restaurant) => (
                    <div key={restaurant.id} className="list-item">
                      <img
                        src={restaurant.image}
                        alt={restaurant.title}
                        className="item-image"
                      />
                      <div className="item-info">
                        <h3 className="item-title">{restaurant.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="item-subtitle">{restaurant.cuisine}</span>
                          <span className="text-xs text-green-600 font-semibold">{restaurant.priceRange}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{restaurant.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Accommodations */}
            {touristData.nearbyAccommodations && touristData.nearbyAccommodations.length > 0 && (
              <div className="content-card">
                <h2 className="card-title">
                  <div className="title-icon title-icon--purple">
                    <Bed className="text-white" size={20} />
                  </div>
                  주변 숙소
                </h2>

                <div className="list-container">
                  {touristData.nearbyAccommodations.map((accommodation) => (
                    <div key={accommodation.id} className="list-item">
                      <img
                        src={accommodation.image}
                        alt={accommodation.title}
                        className="item-image"
                      />
                      <div className="item-info">
                        <h3 className="item-title">{accommodation.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="item-subtitle">{accommodation.type}</span>
                          <span className="text-xs text-blue-600 font-semibold">{accommodation.priceRange}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{accommodation.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDetailPage;