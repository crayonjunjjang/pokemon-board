// 데이터베이스(db.json 파일) 읽기/쓰기 기능을 제공하는 유틸리티 함수를 불러옵니다.
const { readDb, writeDb } = require('../database');
// 비밀번호 해싱을 위한 라이브러리인 bcrypt를 불러옵니다.
const bcrypt = require('bcrypt');

// 비밀번호 해싱에 사용될 솔트(salt)의 라운드 수를 정의합니다.
const saltRounds = 10;

/**
 * 새로운 사용자를 등록하는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.body로 이름, 아이디, 비밀번호를 받음)
 * @param {object} res - Express 응답 객체
 */
const register = async (req, res) => {
  try {
    // 요청 본문에서 사용자 이름, 아이디, 비밀번호를 가져옵니다.
    const { name, username, password } = req.body;

    // 필수 필드가 누락된 경우 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!name || !username || !password) {
      return res.status(400).send('이름, 아이디, 비밀번호를 모두 입력해주세요.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();

    // 이미 존재하는 아이디인지 확인합니다.
    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) {
      // 이미 사용 중인 아이디인 경우 409 상태 코드와 함께 에러 메시지를 응답합니다.
      return res.status(409).send('이미 사용 중인 아이디입니다.');
    }

    // 비밀번호를 해싱합니다.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 새로운 사용자 객체를 생성합니다.
    const newUser = {
      // 기존 사용자 ID 중 최대값 + 1, 없으면 1을 할당합니다.
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      name, // 사용자 이름
      username, // 사용자 아이디
      password: hashedPassword, // 해싱된 비밀번호
    };

    // 데이터베이스의 사용자 목록에 새 사용자를 추가합니다.
    db.users.push(newUser);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);

    // 201 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(201).send('회원가입이 완료되었습니다.');

  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in register:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 사용자를 로그인시키는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.body로 아이디와 비밀번호를 받음, req.session에 사용자 정보 저장)
 * @param {object} res - Express 응답 객체
 */
const login = async (req, res) => {
  try {
    // 요청 본문에서 아이디와 비밀번호를 가져옵니다.
    const { username, password } = req.body;

    // 아이디 또는 비밀번호가 누락된 경우 400 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!username || !password) {
      return res.status(400).send('아이디와 비밀번호를 모두 입력해주세요.');
    }

    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 해당 아이디를 가진 사용자를 찾습니다.
    const user = db.users.find(u => u.username === username);

    // 사용자를 찾을 수 없으면 401 상태 코드와 함께 에러 메시지를 응답합니다.
    if (!user) {
      return res.status(401).send('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 입력된 비밀번호와 저장된 해싱된 비밀번호를 비교합니다.
    const match = await bcrypt.compare(password, user.password);

    // 비밀번호가 일치하는 경우
    if (match) {
      // 세션에 사용자 정보를 저장합니다 (비밀번호 제외).
      req.session.user = {
        id: user.id,
        name: user.name,
        username: user.username
      };
      // 200 상태 코드와 함께 성공 메시지를 응답합니다.
      res.status(200).send('로그인 성공');
    } else {
      // 비밀번호가 일치하지 않으면 401 상태 코드와 함께 에러 메시지를 응답합니다.
      res.status(401).send('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in login:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 사용자를 로그아웃시키는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.session을 파괴함)
 * @param {object} res - Express 응답 객체
 */
const logout = (req, res) => {
  // 세션을 파괴합니다.
  req.session.destroy(err => {
    if (err) {
      // 세션 파괴 중 오류가 발생하면 500 상태 코드와 함께 에러 메시지를 응답합니다.
      return res.status(500).send('로그아웃에 실패했습니다.');
    }
    // 세션 쿠키를 클리어합니다 (기본 세션 쿠키 이름은 'connect.sid').
    res.clearCookie('connect.sid');
    // 200 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(200).send('로그아웃 성공');
  });
};

/**
 * 현재 로그인 상태를 확인하여 클라이언트에 반환하는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.session.user로 사용자 정보를 확인)
 * @param {object} res - Express 응답 객체
 */
const status = (req, res) => {
  // 세션에 사용자 정보가 있으면 로그인된 상태로 간주합니다.
  if (req.session.user) {
    // 로그인 상태와 사용자 정보를 JSON 형태로 응답합니다.
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    // 사용자 정보가 없으면 로그인되지 않은 상태로 응답합니다.
    res.status(200).json({ loggedIn: false });
  }
};

// 모든 컨트롤러 함수들을 모듈의 외부로 내보냅니다.
module.exports = { register, login, logout, status };
