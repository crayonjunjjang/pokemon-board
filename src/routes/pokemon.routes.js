// Express 프레임워크에서 라우터를 생성하기 위해 express 모듈을 불러옵니다.
const express = require('express');
// 새로운 라우터 인스턴스를 생성합니다.
const router = express.Router();
// 포켓몬 관련 게시글 및 댓글의 CRUD(생성, 읽기, 업데이트, 삭제) 로직을 처리하는 컨트롤러 함수들을 불러옵니다.
const {
  getAllPokemon,
  getPokemonById,
  createPokemonPost,
  updatePokemonPost,
  deletePokemonPost,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/pokemon.controller.js');

// 사용자 인증 및 권한 확인을 위한 미들웨어 함수들을 불러옵니다.
const { isLoggedIn, isPostOwner, isCommentOwner } = require('../middleware/auth.middleware.js');

// --- 포켓몬 게시글 관련 API 엔드포인트 정의 ---

// GET /api/pokemon/ : 모든 포켓몬 게시글을 조회합니다.
router.get('/', getAllPokemon);

// GET /api/pokemon/:id : 특정 ID를 가진 포켓몬 게시글을 조회합니다.
router.get('/:id', getPokemonById);

// POST /api/pokemon/ : 새로운 포켓몬 게시글을 생성합니다.
// 게시글 생성 전에 사용자가 로그인되어 있는지 확인하는 isLoggedIn 미들웨어를 적용합니다.
router.post('/', isLoggedIn, createPokemonPost);

// PUT /api/pokemon/:id : 특정 ID를 가진 포켓몬 게시글을 수정합니다.
// 게시글 수정 전에 사용자가 로그인되어 있고, 해당 게시글의 소유자인지 확인하는 미들웨어를 적용합니다.
router.put('/:id', isLoggedIn, isPostOwner, updatePokemonPost);

// DELETE /api/pokemon/:id : 특정 ID를 가진 포켓몬 게시글을 삭제합니다.
// 게시글 삭제 전에 사용자가 로그인되어 있고, 해당 게시글의 소유자인지 확인하는 미들웨어를 적용합니다.
router.delete('/:id', isLoggedIn, isPostOwner, deletePokemonPost);

// --- 댓글 관련 API 엔드포인트 정의 ---

// POST /api/pokemon/:id/comments : 특정 게시글에 새로운 댓글을 생성합니다.
// 댓글 생성 전에 사용자가 로그인되어 있는지 확인하는 isLoggedIn 미들웨어를 적용합니다.
router.post('/:id/comments', isLoggedIn, createComment);

// PUT /api/pokemon/:id/comments/:commentId : 특정 게시글의 특정 댓글을 수정합니다.
// 댓글 수정 전에 사용자가 로그인되어 있고, 해당 댓글의 소유자인지 확인하는 미들웨어를 적용합니다.
router.put('/:id/comments/:commentId', isLoggedIn, isCommentOwner, updateComment);

// DELETE /api/pokemon/:id/comments/:commentId : 특정 게시글의 특정 댓글을 삭제합니다.
// 댓글 삭제 전에 사용자가 로그인되어 있고, 해당 댓글의 소유자인지 확인하는 미들웨어를 적용합니다.
router.delete('/:id/comments/:commentId', isLoggedIn, isCommentOwner, deleteComment);

// 설정된 라우터를 모듈 외부로 내보냅니다.
module.exports = router;