// 데이터베이스(db.json 파일) 읽기/쓰기 기능을 제공하는 유틸리티 함수를 불러옵니다.
const { readDb, writeDb } = require('../database');

// --- 각 라우트의 실제 로직을 담당할 컨트롤러 함수들 ---

/**
 * 모든 포켓몬 게시글을 조회하여 반환합니다.
 * 게시글은 작성일 내림차순(최신순)으로 정렬되며, 작성일이 같을 경우 ID 내림차순으로 정렬됩니다.
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 */
const getAllPokemon = async (req, res) => {
  try {
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 게시글 목록을 복사하여 작성일과 ID를 기준으로 정렬합니다.
    const sortedPosts = [...db.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    // 정렬된 게시글 목록을 JSON 형태로 응답합니다.
    res.status(200).json(sortedPosts);
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in getAllPokemon:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 ID를 가진 포켓몬 게시글을 조회하여 반환합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를 받음)
 * @param {object} res - Express 응답 객체
 */
const getPokemonById = async (req, res) => {
  try {
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id } = req.params;
    // 데이터베이스에서 해당 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(id));

    // 게시글이 존재하면 JSON 형태로 응답합니다.
    if (post) {
      res.status(200).json(post);
    } else {
      // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
      res.status(404).send('게시글을 찾을 수 없습니다.');
    }
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in getPokemonById:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 새로운 포켓몬 게시글을 생성합니다.
 * @param {object} req - Express 요청 객체 (req.body로 제목과 내용을, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 */
const createPokemonPost = async (req, res) => {
  try {
    // 요청 본문에서 제목과 내용을 가져옵니다.
    const { title, content } = req.body;

    // 제목 또는 내용이 없으면 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!title || !content) {
      return res.status(400).send('제목과 내용을 모두 입력해주세요.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    const posts = db.posts;

    // 새로운 게시글 객체를 생성합니다.
    const newPost = {
      // 현재 게시글 중 가장 큰 ID에 1을 더하거나, 게시글이 없으면 1을 할당합니다.
      id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      title, // 게시글 제목
      author: req.session.user.name, // 세션에서 현재 로그인한 사용자의 이름을 작성자로 설정합니다.
      authorId: req.session.user.id, // 세션에서 현재 로그인한 사용자의 ID를 작성자 ID로 설정합니다.
      createdAt: new Date().toISOString().split('T')[0], // 현재 날짜를 YYYY-MM-DD 형식으로 설정합니다.
      content // 게시글 내용
    };

    // 데이터베이스의 게시글 목록에 새 게시글을 추가합니다.
    db.posts.push(newPost);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 생성된 게시글 객체를 201 상태 코드와 함께 JSON 형태로 응답합니다.
    res.status(201).json(newPost);
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in createPokemonPost:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 게시글에 새로운 댓글을 생성합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.body로 댓글 내용을, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 */
const createComment = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id: postId } = req.params;
    // 요청 본문에서 댓글 내용을 가져옵니다.
    const { content } = req.body;
    // 세션에서 현재 로그인한 사용자의 ID와 이름을 가져옵니다.
    const { id: userId, name: userName } = req.session.user;

    // 댓글 내용이 없으면 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!content) {
      return res.status(400).send('댓글 내용을 입력해주세요.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 게시글 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(postId));

    // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (!post) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    // 게시글에 comments 배열이 없으면 초기화합니다.
    if (!post.comments) {
      post.comments = [];
    }

    // 새로운 댓글 객체를 생성합니다.
    const newComment = {
      // 현재 게시글의 댓글 중 가장 큰 ID에 1을 더하거나, 댓글이 없으면 1을 할당합니다.
      id: post.comments.length > 0 ? Math.max(...post.comments.map(c => c.id)) + 1 : 1,
      authorId: userId, // 댓글 작성자 ID
      author: userName, // 댓글 작성자 이름
      content, // 댓글 내용
      createdAt: new Date().toISOString(), // 현재 시간을 ISO 형식으로 설정합니다.
    };

    // 게시글의 댓글 목록에 새 댓글을 추가합니다.
    post.comments.push(newComment);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 생성된 댓글 객체를 201 상태 코드와 함께 JSON 형태로 응답합니다.
    res.status(201).json(newComment);

  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in createComment:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 ID를 가진 포켓몬 게시글을 수정합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.body로 제목과 내용을 받음)
 * @param {object} res - Express 응답 객체
 */
const updatePokemonPost = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id: postId } = req.params;
    // 요청 본문에서 제목과 내용을 가져옵니다.
    const { title, content } = req.body;

    // 제목 또는 내용이 없으면 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!title || !content) {
      return res.status(400).send('제목과 내용을 모두 입력해주세요.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 게시글 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(postId));

    // 미들웨어(isPostOwner)에서 이미 게시글 존재 여부와 사용자 권한을 확인하므로, 여기서는 추가 확인 없이 바로 수정합니다.
    post.title = title; // 게시글 제목 업데이트
    post.content = content; // 게시글 내용 업데이트

    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 수정된 게시글 객체를 200 상태 코드와 함께 JSON 형태로 응답합니다.
    res.status(200).json(post);
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in updatePokemonPost:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 ID를 가진 포켓몬 게시글을 삭제합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를 받음)
 * @param {object} res - Express 응답 객체
 */
const deletePokemonPost = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id: postId } = req.params;
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();

    // 데이터베이스에서 해당 ID를 가진 게시글의 인덱스를 찾습니다.
    const postIndex = db.posts.findIndex(p => p.id === parseInt(postId));

    // 미들웨어(isPostOwner)에서 이미 게시글 존재 여부와 사용자 권한을 확인하므로, 여기서는 추가 확인 없이 바로 삭제합니다.
    // 게시글 목록에서 해당 인덱스의 게시글을 제거합니다.
    db.posts.splice(postIndex, 1);

    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 200 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(200).send('게시글이 삭제되었습니다.');
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in deletePokemonPost:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 게시글의 특정 댓글을 수정합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.params.commentId로 댓글 ID를, req.body로 댓글 내용을, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 */
const updateComment = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID와 댓글 ID를 가져옵니다.
    const { id: postId, commentId } = req.params;
    // 요청 본문에서 댓글 내용을 가져옵니다.
    const { content } = req.body;
    // 세션에서 현재 로그인한 사용자 정보를 가져옵니다.
    const { user } = req.session;

    // 사용자가 로그인되어 있지 않으면 401 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!user) {
      return res.status(401).send('로그인이 필요합니다.');
    }

    // 댓글 내용이 없으면 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!content) {
      return res.status(400).send('댓글 내용을 입력해주세요.');
    }

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
    if (comment.authorId !== user.id) {
      return res.status(403).send('수정 권한이 없습니다.');
    }

    comment.content = content; // 댓글 내용 업데이트
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 수정된 댓글 객체를 200 상태 코드와 함께 JSON 형태로 응답합니다.
    res.status(200).json(comment);
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in updateComment:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 게시글의 특정 댓글을 삭제합니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를, req.params.commentId로 댓글 ID를, req.session.user로 사용자 정보를 받음)
 * @param {object} res - Express 응답 객체
 */
const deleteComment = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID와 댓글 ID를 가져옵니다.
    const { id: postId, commentId } = req.params;
    // 세션에서 현재 로그인한 사용자 정보를 가져옵니다.
    const { user } = req.session;

    // 사용자가 로그인되어 있지 않으면 401 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!user) {
      return res.status(401).send('로그인이 필요합니다.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 게시글 ID를 가진 게시글을 찾습니다.
    const post = db.posts.find(p => p.id === parseInt(postId));
    // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (!post) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    // 게시글의 댓글 목록에서 해당 댓글 ID를 가진 댓글의 인덱스를 찾습니다.
    const commentIndex = post.comments.findIndex(c => c.id === parseInt(commentId));
    // 댓글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (commentIndex === -1) {
      return res.status(404).send('댓글을 찾을 수 없습니다.');
    }

    // 댓글 작성자 ID와 현재 로그인한 사용자 ID가 다르면 403 상태 코드와 함께 에러 메시지를 응답합니다.
    if (post.comments[commentIndex].authorId !== user.id) {
      return res.status(403).send('삭제 권한이 없습니다.');
    }

    // 댓글 목록에서 해당 인덱스의 댓글을 제거합니다.
    post.comments.splice(commentIndex, 1);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 200 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(200).send('댓글이 삭제되었습니다.');
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in deleteComment:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

// 모든 컨트롤러 함수들을 모듈의 외부로 내보냅니다.
module.exports = {
  getAllPokemon,
  getPokemonById,
  createPokemonPost,
  updatePokemonPost,
  deletePokemonPost,
  createComment,
  updateComment,
  deleteComment,
};