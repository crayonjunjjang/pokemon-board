// Express 프레임워크에서 라우터를 생성하기 위해 express 모듈을 불러옵니다.
const express = require('express');
// 새로운 라우터 인스턴스를 생성합니다.
const router = express.Router();
// 사용자 인증(회원가입, 로그인, 로그아웃, 로그인 상태 확인) 로직을 처리하는 컨트롤러 함수들을 불러옵니다.
const { register, login, logout, status } = require('../controllers/auth.controller.js');

// --- 사용자 인증 관련 API 엔드포인트 정의 ---

// POST /api/auth/register : 새로운 사용자를 등록합니다.
router.post('/register', register);

// POST /api/auth/login : 사용자를 로그인합니다.
router.post('/login', login);

// POST /api/auth/logout : 사용자를 로그아웃합니다.
router.post('/logout', logout);

// GET /api/auth/status : 클라이언트에서 현재 로그인 상태를 확인합니다.
router.get('/status', status);

// 설정된 라우터를 모듈 외부로 내보냅니다.
module.exports = router;