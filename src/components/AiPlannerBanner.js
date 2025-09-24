import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import "./AiPlannerBanner.scss";

const SLIDE_INTERVAL_MS = 5000;

export default function AiPlannerBanner() {
  const slides = useMemo(
    () => [
      { src: "/image/HaeundaeBeach.jpg", alt: "해운대 해수욕장 전경", caption: "끝없이 펼쳐진 모래사장, 해운대" },
      { src: "/image/gwangalli_beach.jpg", alt: "광안리 야경과 광안대교", caption: "밤이 더 빛나는 광안리" },
      { src: "/image/gamcheon.jpg", alt: "감천문화마을 전경", caption: "알록달록 감천문화마을" },
      { src: "/image/JagalchiMarket.jpg", alt: "자갈치 시장 풍경", caption: "부산의 미각, 자갈치 시장" },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    slides.forEach(s => { const img = new Image(); img.src = s.src; });
  }, [slides]);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => setIndex(p => (p + 1) % slides.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [slides.length, isPaused]);

  const goPrev = () => setIndex(p => (p - 1 + slides.length) % slides.length);
  const goNext = () => setIndex(p => (p + 1) % slides.length);

  return (
    <section
      className="ai-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 배경 */}
      <Box className="ai-banner__bg">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={`ai-banner__bg-img ${i === index ? "is-active" : ""}`}
            aria-hidden={i === index ? "false" : "true"}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="ai-banner__bg-gradient" />
        <div className="ai-banner__shape-1" />
        <div className="ai-banner__shape-2" />
      </Box>

      {/* 컨텐츠 */}
      <Box className="ai-banner__content">
        <Box className="ai-banner__left">
          <Typography variant="h3" className="ai-banner__title">
            AI 맞춤 부산 여행, 지금 바로 시작하세요!
          </Typography>

          <Typography variant="subtitle1" className="ai-banner__subtitle">
            복잡한 계획은 AI에게 맡기고, <br />
            나만을 위한 특별한 부산 여행 코스를 경험해보세요.
          </Typography>

          <Stack direction="row" spacing={1} className="ai-banner__hashtags" useFlexGap flexWrap="wrap">
            {["#해운대", "#광안리", "#맞춤여행", "#부산맛집"].map(tag => (
              <Chip key={tag} label={tag} className="ai-banner__chip" />
            ))}
          </Stack>

          <Stack direction="row" spacing={2} className="ai-banner__cta">
            <Button
              variant="contained"
              color="primary"
              className="ai-banner__btn"
              component={RouterLink}
              to="/survey"
              size="large"
              disableElevation
            >
              나만의 여행 코스 만들기 →
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              className="ai-banner__btn-secondary"
              component={RouterLink}
              to="/explore"
              size="large"
              disableElevation
            >
              인기 코스 구경하기
            </Button>
          </Stack>

          <Typography variant="caption" className="ai-banner__caption">
            {slides[index].caption}
          </Typography>
        </Box>

        {/* 하단 컨트롤 바: ⟨ ⟩ + 점 */}
        <div className="ai-banner__controls" role="group" aria-label="슬라이드 내비게이션">
          <button className="ctrl-btn" aria-label="이전 슬라이드" onClick={goPrev}>
            <ArrowBackIosNew fontSize="small" />
          </button>

          <div className="ai-banner__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`ai-banner__dot ${i === index ? "is-active" : ""}`}
                aria-label={`슬라이드 ${i + 1} 보기`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          <button className="ctrl-btn" aria-label="다음 슬라이드" onClick={goNext}>
            <ArrowForwardIos fontSize="small" />
          </button>
        </div>
      </Box>
    </section>
  );
}
