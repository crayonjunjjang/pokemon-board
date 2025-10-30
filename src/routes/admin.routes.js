// Express 프레임워크에서 라우터를 생성하기 위해 express 모듈을 불러옵니다.
const express = require('express');
// 새로운 라우터 인스턴스를 생성합니다.
const router = express.Router();
// 관리자 기능(관리자 데이터 조회, 게시글 삭제, 사용자 삭제) 로직을 처리하는 컨트롤러 함수들을 불러옵니다.
const { getAdminData, deletePost, deleteUser } = require('../controllers/admin.controller.js');
// 사용자 로그인 상태 및 관리자 권한 확인을 위한 미들웨어 함수들을 불러옵니다.
const { isLoggedIn, isAdmin } = require('../middleware/auth.middleware.js');

// 모든 관리자 라우트에 대해 로그인 여부와 관리자 권한을 확인하는 미들웨어를 적용합니다.
// 이 미들웨어는 이 라우터에 정의된 모든 하위 경로에 적용됩니다.
router.use(isLoggedIn, isAdmin);

// --- 관리자 기능 관련 API 엔드포인트 정의 ---

// GET /api/admin/data : 관리자 페이지에 필요한 데이터를 조회합니다 (예: 모든 게시글, 모든 사용자 목록).
router.get('/data', getAdminData);

// DELETE /api/admin/posts/:id : 특정 ID를 가진 게시글을 삭제합니다.
router.delete('/posts/:id', deletePost);

// DELETE /api/admin/users/:id : 특정 ID를 가진 사용자를 삭제합니다.
router.delete('/users/:id', deleteUser);

// 설정된 라우터를 모듈 외부로 내보냅니다.
module.exports = router;