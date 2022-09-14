const express=require('express');
const axios=require('axios');
const cheerio=require('cheerio');
const bodyp=require('body-parser');
const app=express();
const methodO=require('method-override');
const PORT=process.env.PORT||3000;
const cors = require('cors');
const base="https://www.shutterstock.com/";
const mysql=require('mysql');
const { generateApiKey } = require('generate-api-key');



const con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"123",
    database:"photoApi"
})

app.use(bodyp.urlencoded({extended:true}))
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(cors(
  {
    origin: '*'
  }
  ));


app.get('/',(req,res)=>{
  res.render('main');
})


app.get('/login',(req,res)=>{
  res.render('login');
})



app.post('/login',(req,res)=>{
  let name=req.body.name;
  let pass=req.body.pass;
  con.query(`select * from users where name="${name}";`,(err,ress,file)=>{

    if(err){
      res.render('login',{err:"something went wrong try agine"});
    }
    else if(ress.length==0)
    {
      res.render('login',{err:"user name not found"});
    }
    else if(pass!=ress[0].pass){
      res.render("login",{err:"incorrect password",name:name});
    }
    else{
      res.json({
        name:name,
        password:pass,
        apikey:ress[0].apikey
      })
    }
  })

})



app.get('/signin',(req,res)=>{
  res.render('signin');
})



app.post('/signin',(req,res)=>{

  let name=req.body.name;
  let pass=req.body.pass;
  let passcon=req.body.passcon;
  if(pass!=passcon)
  {
    res.render('signin',{err:"check password confirm"})
  }
  else{
  let apikey=generateApiKey({  method: 'uuidv5',
  name: 'production app',
  namespace: '1dfdf2c1-7365-4625-b7d9-d9db5210f18d'
});
  con.query(`insert into users(name,pass,apikey) values("${name}",${pass},"${apikey}") `,(err,ress,file)=>{
    if(err){
      res.render('signin',{err:"user name already used"});
    }
    else{
      res.json({
        name:name,
        password:pass,
        apikey:apikey
      })
    }
  })
}
})


app.get('/docs',(req,res)=>{
   res.render('docs');
})





app.get('/search/:id',async(req,res)=>{
    let results=[]
  
    let pages;
    let done=true;
    let errmessage;
    
    let apikey=req.query.apikey;
    con.query(`select * from users where apikey="${apikey}"`,async (err,ress,fiel)=>{
      if(err)
      {
        console.log(err);
      }
      if(ress.length==0){
      res.json({
        err:'invalid api key'
      })
      }
      else{
        let age=req.query.age==null ? "":String(req.query.age)
        let mreleased=req.query.mreleased==null ? "":String(req.query.mreleased)
        let color=req.query.color==null ? "":String(req.query.color);
        let page = req.query.page==null ? 1:req.query.page;
        let orientation=req.query.orientation==null? "":String(req.query.orientation);
        let image_type= req.query.image_type==null ? "":String(req.query.image_type);
        let gender=req.query.gender==null ? "":String(req.query.gender);
        let Ethnicity=req.query.ethnicity == null ? "":String(req.query.ethnicity);
        let people_number= req.query.people_number ==null ? "":String(req.query.people_number);
        let min_height=req.query.min_height==null ? "":String(req.query.min_height);
        let min_width=req.query.min_width==null ? "":String(req.query.min_width);
        let measurement=req.query.measurement ==null ?"":String(req.query.measurement);
        let authentic=req.query.authentic ==null ?"":String(req.query.authentic);
        let category= req.query.category == null ? "":String(req.query.category);
        let sort= req.query.sort == null ? "popular":String(req.query.sort);
    
        let num_results;
        console.log(page);
        await axios(base+`search/${req.params.id}?sort=${sort}&category=${category}&authentic=${authentic}&measurement=${measurement}&min_height=${min_height}&min_width=${min_width}&people_number=${people_number}&ethnicity=${Ethnicity}&gender=${gender}&age=${age}&image_type=${image_type}&page=${page}&orientation=${orientation}&color=${color}&mreleased=${mreleased}`)
        .then(response=>{
            const html=response.data;
            const $ = cheerio.load(html);
            let i=0;
            $(`img`,html).each(function(){  
              const image=$(this).attr('src');
              if(i>=4)
              results.push({
                image:image
              })
              i++;
            })
         
    
            $(`.MuiBox-root`).each(function(){
              pages=$(this).find("span").text();
            })
          
            $(`h2`).each(function(){
              num_results=String($(this).text());
            })
      
        }).catch(err=>{
            done=false;
            errmessage=err.message;
        })
        console.log('pages :'+pages)
       console.log('done');
       if(!done)
       {
        res.json(errmessage);
       }
       else if(res.length==0)
       {
          res.json("no results found");
       }
       else{
       let num_res=num_results.split(" ");
       console.log(num_res);
       num_res=num_res[0]; 
       res.json({
        images:num_res,
        image_type:image_type,
        min_height:min_height,
        min_width:min_width,
        color:color,
        orientation:orientation,
        gender:gender,
        age:age,
        withPeople:mreleased,
        people_number:people_number,
        pages:String(page)+String(pages),
        results:results});
       }
      
      }
    })
  })



app.listen(PORT);