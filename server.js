var async = require('async');
var fs = require('fs');
var pg = require('pg');
var cookieparser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var express = require('express');
var SHA512 = require('crypto-js/sha512');
var dotenv = require('dotenv');
var cors = require('cors');
var path = require('path');

dotenv.config()
var app = express();
var upload = multer();

var appPort=process.env.PORT||8080;
var cookieTimeout=10;

app.use(cors())
app.use(cookieparser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array()); 
app.use(express.static('public'));

app.get('/auth/script',(request, response)=>{
  response.sendFile(path.join( __dirname + '/scripts/auth.js'));
});

app.get('/auth/style',(request, response)=>{
response.sendFile(path.join( __dirname + '/style/auth.css'));
});

app.get('/logs/script',(request, response)=>{
  response.sendFile(path.join( __dirname + '/scripts/index.js'));
});

app.get('/style',(request, response)=>{
response.sendFile(path.join( __dirname + '/style/style.css'));
});

app.get('/auth',(request, response)=>{
  if(Object.keys(request.cookies).length===0)
    response.sendFile(path.join( __dirname + '/html/login.html'));
  else{
    checkCookies(request.cookies.auth)
    .then(() => {response.sendFile(path.join( __dirname + '/html/index.html')); console.log(Date(),'cookie login' ,request.ip );})
    .catch(() => {response.cookie('auth',null,{maxAge:0});response.redirect("/auth");})
  }

});
app.get('/',(request, response)=>{
  if(Object.keys(request.cookies).length===0)
  response.redirect("/auth");
  else{
    checkCookies(request.cookies.auth)
    .then(() => {response.sendFile(path.join( __dirname + '/html/index.html')); console.log(Date(),'cookie login' ,request.ip );})
    .catch(() => {response.cookie('auth',null,{maxAge:0});response.redirect("/auth");})
  }
});

  app.post('/login',(request,response)=> { 
    if(Object.keys(request.cookies).length===0){
        auth(request.body.email,request.body.password).then((stat) =>{
          let hashCookie=SHA512(`${request.body.email}${(new Date()).toUTCString()}`).toString()
          addcookie(request.body.email,hashCookie);
          response.cookie('auth',hashCookie,{maxAge:cookieTimeout*60000});
          response.send(stat);
          console.log(Date(),'manual login successful' ,request.ip );
        }).catch((stat)=>{
          response.send(stat);
          console.log(Date(),'manual login failed',request.ip);
      })
    }
  });
  app.post('/signup',(request,response)=> { 
    if(Object.keys(request.cookies).length===0){
      checkemail(request.body.email).then(()=>{
        response.send({exists:true});
      }).catch(()=>addUser(request.body.countrycode,request.body.phone,request.body.username,request.body.email,request.body.password)
      .then(() =>{
        response.send({exists:false,status:true});
        console.log(Date(),`user ${request.body.username} registered` ,request.ip );
      }).catch((stat)=>{
      response.body=stat
        response.send({exists:false,status:false});
        console.log(Date(),`registration of ${request.body.username} failed`,request.ip);
      })
      )
    }
  });
  // app.post('/commit',(request,response)=> { 
  //   if(Object.keys(request.cookies).length!=0){
  //       commit(request.cookies.auth,toCol(new Date())).then(() =>{
  //       response.send({pass:true});
  //       console.log(Date(),'commit successful' ,request.ip );
  //   }).catch(()=>{
  //       response.send({pass:false});
  //       console.log(Date(),'commit failed',request.ip);
  //     })
  //   }
  // });
  app.post('/logs',(request,response)=> { 
    if(Object.keys(request.cookies).length!=0){
        getLogs(request.cookies.auth).then((resp) =>{
        response.send(resp);
        console.log(Date(),'logs retrive successful' ,request.ip );
    }).catch((stat)=>{
        response.send(stat);
        console.log(Date(),'logs retrive failed',request.ip);
      })
    }else{

    }
  });
    
  app.get('/logout',(request,response)=> {
      response.cookie('auth',null,{maxAge:0});
      response.redirect("/auth");
      console.log(Date(), 'logout', request.ip);
    });


  app.listen(appPort,()=>{
    console.log(Date(), `APP SERVER ONLINE http://localhost:${appPort}`);
  });
  /////////////////////////////////////////////////////database queries//////////////////////////////////////////////////////////////////////////////////////////////

var config = {
    user: process.env.user,
    password:process.env.pass,
    host: process.env.url,
    database: process.env.dbs,
    port: process.env.dbsPORT,
    sslmode: "verify-full",
    options: "--cluster=db-ckroach-657",
    ssl: {
        ca: fs.readFileSync(__dirname+'/certs/cc-ca.crt').toString()
    }
};

const client = new pg.Client(config);
// async function connect(){await client.connect();}
const print = async () => {
    await client.query(`USE rainbow;`);
    const rs = await client.query(`SELECT * FROM ${process.env.table};`);
    for(let r of rs.fields){
      console.log(r.name)
  }
    console.log(`Your cluster returned ${rs.rowCount} rows`);
    for(let r of rs.rows){
        console.log(`${r.id}\t|${r.countrycode}\t|${r.phone}\t|${r.email}\t|${r.name}\t|${r.passwordhash}\t|${r.cookiehash}\n`)
    }
}
//connect();
//print();

// app.get('/',async (request, response)=>{
//    const res=await client.query('SELECT id, * FROM data;');
//    let count = res.rows[0].count;
//    //console.log(Date(),'count ' ,request.ip );
//    await client.query(`UPDATE data SET count = ${++count} WHERE id = 1`);
//   response.send(`${count} Visits`);
// });
// app.get('/reset',async (request, response)=>{
//     await client.query(`UPDATE data SET count = 0 WHERE id = 1`);
//     console.log(Date(),'reset count ');
//     response.send('reset successful');
//  });

// app.listen(appPort,()=>{
//     console.log(Date(), `APP SERVER ONLINE http://localhost:${appPort}`);
//   });
const setup = async () => { 
    await client.connect(); 
    await client.query(`USE ${process.env.database};`);
    await createTable();
    //let today =new Date();
    //setInterval(updateCol, ONE_DAY);
    //await addColumn(toCol(today));
    //await updateCol();
};
//INSERT INTO users (name,email,cookiehash,cookiehash) VALUES ('lol','a@b.com','asdf','qwer');
//root functions
const stop        = async () =>   await client.shutdown();
const createTable = async () =>   await client.query(`CREATE TABLE IF NOT EXISTS ${process.env.table} ( 
id UUID NOT NULL DEFAULT gen_random_uuid(),
countryCode VARCHAR(5) NOT NULL,
phone BIGINT NOT NULL,
email VARCHAR(50),
name VARCHAR(70),
passwordHash VARCHAR(512) NOT NULL,
cookieHash VARCHAR(512),
PRIMARY KEY(id));`);
const dropTable   = async () =>   await client.query(`DROP TABLE IF EXISTS ${process.env.table}`);
const reset       = async () => { await dropTable(); await createTable();}

//data manupulation
//const addColumn =   async (col) => await client.query(`ALTER TABLE ${process.env.table} ADD ${col} INT`).catch((err)=>console.log(`ignoring ${col} column already exists`));
const addUser   =   async (countrycode,phone,name,email,cookiehash)    => await client.query(`INSERT INTO ${process.env.table} 
                    (countrycode, phone, name ,email ,passwordhash ) VALUES ('${countrycode}',${phone},'${name}','${email}','${cookiehash}');`);
const removeUser=   async (cookiehash)    => await client.query(`DELETE FROM ${process.env.table} WHERE cookiehash = '${cookiehash} IF EXISTS;`);
const addcookie =   async (email,cookiehash) => await client.query(`UPDATE ${process.env.table} SET cookiehash = '${cookiehash}' WHERE EMAIL = '${email}'`)
const checkemail =   async (email) => {
  return myPromise = new Promise(async(success, fail) =>{
    let rs = await client.query(`SELECT email FROM ${process.env.table} WHERE email = '${email}';`);
    if(rs.rowCount==1){
      success();
    }else
      fail();
  })
};
const checkCookies =   async (cookiehash) => {
  return myPromise = new Promise(async(success, fail) =>{
    let rs = await client.query(`SELECT email FROM ${process.env.table} WHERE cookiehash = '${cookiehash}' ;`);
    if(rs.rowCount==1){
      success();
    }else
      fail();
  })
};
// const commit =   async (cookiehash,col) => {
//     let rs = await client.query(`SELECT ${col},email FROM ${process.env.table} WHERE cookiehash = '${cookiehash}' ;`);
//     let v=rs.rows[0][col];
//     if(v==null) v=1;
//     else v++;
//     await client.query(`UPDATE ${process.env.table} SET ${col} = ${v} WHERE email = '${rs.rows[0].email}'`);
// };
const getLogs =  async (cookiehash)  =>{
    return myPromise = new Promise(async(success, fail) =>{
        let rs = await client.query(`SELECT name,phone,email FROM ${process.env.table} WHERE cookiehash = '${cookiehash}' ;`);
        if(rs.rowCount==1){
            row=rs.rows[0];
            success({pass: true , data : row});
        }else
            fail({pass : false});
  })};
  const auth =  async (email,cookiehash)  =>{
    return myPromise = new Promise(async(success, fail) =>{
        let rs = await client.query(`SELECT passwordhash FROM ${process.env.table} WHERE email = '${email}' ;`);
        if(rs.rowCount){
            let row=rs.rows[0];
            if(row.passwordhash==cookiehash)
                success({pass:true});
            else
                fail({pass: false,email:true});
        }else
            fail({pass: false,email:false});
  })};


  async function test() {
      await setup();
      //await reset();
      //await print();
     // await reset();
     // await print();
     //const rs =await client.query(`SELECT passwordhash FROM ${process.env.table} WHERE email = 'a@b.com' ;`);
     //console.log(rs.rows[0])
      //await addUser('+91',3378477892,'hdiusehd@hciehc.com','bobby','gcidg983287dqxbw');
      // await addUser('say2an','say2an@gmail.com','cygai2gk')
      // await getLogs('cygaigk').then((a)=>console.log(a)).catch((a)=>console.log('b',a));
      // await getLogs('csaigk').then((a)=>console.log(a)).catch((a)=>console.log('b',a));
      // await auth('a@b.com','d6f644b19812e97b5d871658d6d3400ecd4787faeb9b8990c1e7608288664be77257104a58d033bcf1a0e0945ff06468ebe53e2dff36e248424c7273117dac09').then(()=>console.log("success")).catch((a)=>console.log('error:',a))
      // await auth('a@b.com','aasdf').then(()=>console.log("success")).catch((a)=>console.log('error:',a))
      // await auth('a@ab.com','asdf').then(()=>console.log("success")).catch((a)=>console.log('error:',a))
      // await addcookie('a@b.com','qwerty')
      // await commit('qwerty',toCol(new Date()))
       //await checkCookies('7d6824ef6c5d09f7807f876e0a6a001950d5d9b56e2d3290a2044a0ddba2086d26b4bdfcebad60f0b3a2a7c3102d4d423e2c5b668855e9687f87fe53b1d54c17')
       //.then(()=>console.log("success")).catch(()=>console.log('error:'))
      //stop();
  }
//setup();
test();
