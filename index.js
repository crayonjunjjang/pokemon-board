// Node.js 기반의 웹 애플리케이션 프레임워크인 Express를 불러옵니다.
const express = require('express');
// 세션 관리를 위한 Express 미들웨어인 express-session을 불러옵니다.
const session = require('express-session');
// 포켓몬 게시글 관련 라우트를 정의한 모듈을 불러옵니다.
const pokemonRouter = require('./src/routes/pokemon.routes.js');
// 사용자 인증 관련 라우트를 정의한 모듈을 불러옵니다.
const authRouter = require('./src/routes/auth.routes.js');
// 관리자 기능 관련 라우트를 정의한 모듈을 불러옵니다.
const adminRouter = require('./src/routes/admin.routes.js');
// 비밀번호 해싱을 위한 라이브러리인 bcrypt를 불러옵니다.
const bcrypt = require('bcrypt');
// 데이터베이스(db.json 파일) 읽기/쓰기 기능을 제공하는 유틸리티 함수를 불러옵니다.
const { readDb, writeDb } = require('./src/database');

// Express 애플리케이션을 생성합니다.
const app = express();
// 서버가 수신할 포트 번호를 정의합니다.
const port = 3000;

// 데이터베이스에 관리자 사용자가 없는 경우, 관리자 사용자를 생성하는 비동기 함수입니다.
async function seedAdminUser() {
  // 데이터베이스를 읽어옵니다.
  const db = await readDb();
  // 데이터베이스에 'admin'이라는 사용자 이름의 관리자가 이미 존재하는지 확인합니다.
  const adminExists = db.users.some(u => u.username === 'admin');

  // 관리자 사용자가 존재하지 않으면 새로 생성합니다.
  if (!adminExists) {
    console.log('Admin user not found, creating one...');
    // 비밀번호 해싱에 사용될 솔트(salt)의 라운드 수를 정의합니다.
    const saltRounds = 10;
    // 'admin' 비밀번호를 해싱합니다.
    const hashedPassword = await bcrypt.hash('admin', saltRounds);
    // 새로운 관리자 사용자 객체를 생성합니다.
    const id = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const adminUser = {
      id: id, // 기존 사용자 ID 중 최대값 + 1, 없으면 1
      name: 'Admin', // 관리자 이름
      username: 'admin', // 관리자 사용자 이름
      password: hashedPassword, // 해싱된 비밀번호
    };
    // 데이터베이스의 사용자 목록에 관리자 사용자를 추가합니다.
    db.users.push(adminUser);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);
    console.log('Admin user created.');
  }
}


// JSON 형식의 요청 본문을 파싱하여 req.body 객체로 만들어주는 미들웨어입니다.
app.use(express.json());

// 세션 미들웨어 설정입니다.
app.use(session({
  secret: 'pokemon-board-secret', // 세션 ID를 서명하는 데 사용되는 비밀 키입니다.
  resave: false, // 세션이 변경되지 않아도 세션 저장소에 다시 저장할지 여부를 설정합니다. (일반적으로 false 권장)
  saveUninitialized: true, // 초기화되지 않은(새로 생성되었지만 수정되지 않은) 세션을 저장소에 저장할지 여부를 설정합니다. (일반적으로 true 권장)
  cookie: {
    httpOnly: true, // 클라이언트 측 스크립트(JavaScript)가 쿠키에 접근할 수 없도록 설정하여 XSS 공격을 방지합니다.
    maxAge: 1000 * 60 * 60 * 24 // 쿠키의 최대 수명(밀리초)을 설정합니다. 여기서는 1일입니다.
  }
}));

// 'public' 폴더에 있는 정적 파일(HTML, CSS, JavaScript, 이미지 등)들을 클라이언트에 직접 제공하는 미들웨어입니다.
app.use(express.static('public'));

// 각 라우터 모듈을 특정 경로에 연결합니다.
// '/api/pokemon' 경로로 들어오는 요청은 pokemonRouter가 처리합니다.
app.use('/api/pokemon', pokemonRouter);
// '/api/auth' 경로로 들어오는 요청은 authRouter가 처리합니다.
app.use('/api/auth', authRouter);
// '/api/admin' 경로로 들어오는 요청은 adminRouter가 처리합니다.
app.use('/api/admin', adminRouter);

// 관리자 사용자 시딩(초기화) 작업을 수행한 후 서버를 시작합니다.
seedAdminUser().then(() => {
  // 서버가 지정된 포트에서 수신 대기하도록 합니다.
  app.listen(port, () => {
    console.log(`포켓몬 게시판 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  });
}).catch(error => {
  // 관리자 사용자 시딩 중 오류가 발생하면 콘솔에 오류를 기록합니다.
  console.error("Failed to seed admin user:", error);
});
