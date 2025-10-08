// src/layouts/FixedLayout.jsx
import React from "react";
import { Box } from "@mui/material";

const PAGE_WIDTH = 2560//원하는 고정 폭

export default function FixedLayout({ children }) {
  return (
    <Box
      sx={{
        width: PAGE_WIDTH,
        minWidth: PAGE_WIDTH,
        maxWidth: PAGE_WIDTH,
        mx: "auto",          // 화면 가운데 정렬
        minHeight: "100vh",
        overflowX: "visible" // 가로 스크롤은 바깥 문서에서 처리
      }}
    >
      {children}
    </Box>
  );
}
