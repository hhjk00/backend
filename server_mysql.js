const express = require('express'); // express 읽어오기
const app = express(); // app 자체가 서버
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({extended : true})) // 미들웨어(use)

//static 파일(변하지 않는 파일, 정적파일)을 보관하기 위해 public 폴더를 사용하겠다.
app.use('/public', express.static('public')); 

// 데이터 수정을 위한 라이브러리
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// 쿠키
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 세션
const session =  require('express-session');
// const FileStore = require('session-file-store')(session);
// app.use(session({
//     secret : '1111',
//     resave : false,
//     saveUninitialized : true,
//     store : new FileStore()
// }))


// ────────────────── Session MySql Store ──────────────────
const MySQLStore = require('express-mysql-session')(session);
app.use(session({
    secret : '1111',
    resave : false,
    saveUninitialized : true,
    store : new MySQLStore({
        host : 'localhost',
        port : 3306,
        user : 'root',
        password : '970604',
        database : 'node_db'
    })
}))



// ────────────────── MySql ──────────────────
const mysql = require('mysql');
const conn = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '970604',
    database : 'node_db',
});

conn.connect();
console.log('접속완료');

app.listen(8080, function() { // 8080 포트에 서버를 띄워라
    console.log('listening on 8080');
})

// md5
let md5 = require('md5');

// 우리가 하고 싶은 것은 "xxx로 접속하면 xxx를 해주세요"
// 누군가가 /webtoon 방문하면 웹툰 관련 안내문을 띄워주자.
// 라우터 get/post

app.get('/webtoon', function(req, res) { // 접속이 들어오면 콜백함수 실행
    res.send('웹툰을 서비스 해주는 페이지 입니다.');
})

app.get('/game', function(req, res) { // 접속이 들어오면 콜백함수 실행
    res.send('게임을 서비스 해주는 페이지 입니다.');
})

app.get('/', function(req, res) { // 접속이 들어오면 콜백함수 실행
    res.render('index.ejs',);
})

app.get('/write', function(req, res) { // 접속이 들어오면 콜백함수 실행
    res.render('write_mysql.ejs');
})



// req = 요청정보 , res = 행위
app.post('/add', (req, res) => { // 화살표 함수
    // console.log(req.body.title)
    // console.log(req.body.date)
    
    let sql = `insert into todo (title, curdate) values ( "${req.body.title}", "${req.body.date}" )`;

    conn.query(sql, function(err, rows, fields) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/list');
        }
    })
    
})


// list get 요청(페이지를 보여줘라)으로 접속하면
// 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML 보여주세요.

app.get('/list', function(req, res) {
    let sql = "select * from todo";
    let list = '';

    conn.query(sql, function(err, rows, fields) {
        if(err) {
            return console.log(err);
        } else {
            // for(let i = 0; i < rows.length; i++) {
            //     list += rows[i].title + " : " + rows[i].curdate + "<br/>";
            // }
            // res.send(list);
            console.log(rows);
            res.render("list_mysql.ejs", {posts : rows});
        }

    })
})

app.delete('/delete', function(req, res) {
    console.log(req.body)
    req.body._id = parseInt(req.body._id);
    // req.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아 삭제해주세요.
    db.collection('post').deleteOne(req.body, function(err) {
        if(err) return console.log(err);
        console.log('삭제완료');
        res.status(200).send({message: '성공'})
    })
})


app.get("/detail/:id", (req, res) => {
    console.log('상세페이지');
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result) {
        if(err) return console.log(err);
        console.log(result);
        res.render('detail.ejs', {data : result});
    })
})

app.get('/edit/:id', function(req, res) {
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result) {
        if(err) return console.log(err);
        res.render('edit.ejs', { post : result }); 
    })
})

app.put("/edit", function(req, res) {
    // 폼에 담긴 todo 데이터, date 데이터를 가지고 db.collection(post)를 업데이트 시킴
    console.log('업데이트')
    db.collection('post').updateOne(
        { _id : parseInt(req.body.id) },
        { $set : { todo : req.body.title , date : req.body.date }},
        
        function(err, reuslt) {
        if(err) return console.log(err);
        console.log('수정완료');
        res.redirect('/list');
        })
})


// 쿠키
// app.get('/count', function(req, res) {
//     if(req.cookies.count) {
//         var count = parseInt(req.cookies.count);
//     } else {
//         var count = 0;
//     }

//     count = count + 1;
//     res.cookie('count', count);
//     res.send('count : ' + count);
// })



// 세션
app.get('/count', function(req, res) {
    if(req.session.count) {
        req.session.count++;
    } else {
        req.session.count = 1;
    }
    res.send('count : ' + req.session.count);
})

app.get('/temp', function(req, res) {
    res.send('result : ' + req.session.userid);
})

let salt = 'kfs28da6ksa'

// 로그인 라우터
app.get('/login', (req, res) => { 
    res.render('login.ejs');
})

app.post('/login', (req, res) => {
    let userid = req.body.id;
    let userpw = req.body.pw;

    console.log(userid)
    console.log(userpw)

    let sql = "select * from login";
    conn.query(sql, function(err, rows, fields) {
        if (err) {
            console.log(err);
        }

        for (let i = 0; i < rows.length; i++) {

            if(rows[i].userid == userid) {
                console.log(md5(rows[i].userpw + salt ))
                console.log(md5(userpw + salt))

                if(md5(rows[i].userpw + salt) == md5(userpw + salt)) {
                    req.session.userid = userid;
                    res.redirect('/');
                }
                else {
                    res.send('비밀번호가 틀렸습니다.')
                }
            }
        }
    })
})


// 회원가입 라우터
app.get('/signup', (req, res) => { 
    res.render('signup.ejs');
})

app.post('/signup', (req, res) => { 
    // console.log(req.body.id);
    // console.log(req.body.pw);
    // console.log(req.body.mobile);
    // console.log(req.body.country);

    let sql = `insert into login (userid, userpw, mobile, country) values ( "${req.body.id}", "${req.body.pw}", "${req.body.mobile}", "${req.body.country}" )`;

    conn.query(sql, function(err, rows, fields) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    })
})


app.get("/logout", (req, res) => {
    delete req.session.userid;
    res.redirect("/");
})