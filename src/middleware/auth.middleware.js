// 데이터베이스(db.json 파일) 읽기 기능을 제공하는 유틸리티 함수를 불러옵니다.
const { readDb } = require('../database');

/**
 * 사용자가 로그인되어 있는지 확인하는 미들웨어 함수입니다.
 * 로그인되어 있지 않으면 401 Unauthorized 응답을 보냅니다.
 * @param {object} req - Express 요청 객체 (req.session.user로 로그인 정보 확인)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const isLoggedIn = (req, res, next) => {
  // 세션에 사용자 정보가 있으면 로그인된 상태로 간주합니다.
  if (req.session.user) {
    // 다음 미들웨어로 제어를 넘깁니다.
    return next();
  }
  // 로그인되어 있지 않으면 401 상태 코드와 함께 에러 메시지를 응답합니다.
  res.status(401).send('로그인이 필요합니다.');
};

/**
 * 현재 로그인한 사용자가 게시글의 소유자인지 확인하는 미들웨어 함수입니다.
 * 소유자가 아니면 403 Forbidden 응답을 보냅니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const isPostOwner = async (req, res, next) => {
  try {
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id: postId } = req.params;
    // 세션에서 현재 로그인한 사용자의 ID를 가져옵니다.
    const userId = req.session.user.id;

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 게시글 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(postId));

    // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (!post) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    // 게시글 작성자 ID와 현재 로그인한 사용자 ID를 정수로 변환하여 비교합니다.
    // post.authorId가 없을 경우 0으로 기본값을 설정하여 오류를 방지합니다.
    const postAuthorId = parseInt(post.authorId || 0);
    const currentUserId = parseInt(userId);

    // 작성자 ID가 일치하지 않으면 403 상태 코드와 함께 에러 메시지를 응답합니다.
    if (postAuthorId !== currentUserId) {
      return res.status(403).send('권한이 없습니다.');
    }

    // 권한이 확인되면 다음 미들웨어로 제어를 넘깁니다.
    next();
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in isPostOwner middleware:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 현재 로그인한 사용자가 관리자 권한을 가지고 있는지 확인하는 미들웨어 함수입니다.
 * 관리자가 아니면 403 Forbidden 응답을 보냅니다.
 * @param {object} req - Express 요청 객체 (req.session.user로 사용자 정보 확인)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const isAdmin = (req, res, next) => {
  // 세션에 사용자 정보가 있고, 사용자 이름이 'admin'이면 관리자로 간주합니다.
  if (req.session.user && req.session.user.username === 'admin') {
    // 다음 미들웨어로 제어를 넘깁니다.
    return next();
  }
  // 관리자 권한이 없으면 403 상태 코드와 함께 에러 메시지를 응답합니다.
  res.status(403).send('관리자 권한이 필요합니다.');
};

/**
 * 현재 로그인한 사용자가 댓글의 소유자인지 확인하는 미들웨어 함수입니다.
 * 소유자가 아니면 403 Forbidden 응답을 보냅니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.params.commentId로 댓글 ID를, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const isCommentOwner = async (req, res, next) => {
  try {
    // 요청 파라미터에서 게시글 ID와 댓글 ID를 가져옵니다.
    const { id: postId, commentId } = req.params;
    // 세션에서 현재 로그인한 사용자의 ID를 가져옵니다.
    const { id: userId } = req.session.user;

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 게시글 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(postId));

    // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (!post) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    // 게시글의 댓글 목록에서 해당 댓글 ID를 가진 댓글을 찾습니다.
    const comment = post.comments.find(c => c.id === parseInt(commentId));

    // 댓글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (!comment) {
      return res.status(404).send('댓글을 찾을 수 없습니다.');
    }

    // 댓글 작성자 ID와 현재 로그인한 사용자 ID가 다르면 403 상태 코드와 함께 에러 메시지를 응답합니다.
    if (comment.authorId !== userId) {
      return res.status(403).send('권한이 없습니다.');
    }

    // 권한이 확인되면 다음 미들웨어로 제어를 넘깁니다.
    next();
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in isCommentOwner middleware:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

// 모든 미들웨어 함수들을 모듈의 외부로 내보냅니다.
module.exports = { isLoggedIn, isPostOwner, isAdmin, isCommentOwner };