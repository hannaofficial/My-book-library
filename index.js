//biggest learning I create button using form and any time i was clicking the form was automatically clicking that's why the popup items was appearing for a econd and then disappears

import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import {fileURLToPath} from "url";
import pg from "pg";
import axios from "axios";
import  Jimp  from "jimp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 2000;

console.log(__dirname)

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"books",
    password:"12345",
    port:5432
});
db.connect()

async function books() {
    const result = await db.query("SELECT * FROM books ORDER BY rating DESC;");
    return result.rows;
    
  }
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));



app.get("/",async (req,res) => {
    const Books = await books()
    res.render(__dirname + "/ejs/index.ejs",{
    appName : "MY LIBRARY",
   
    books: Books
 })
});

app.post("/search",async (req,res)=>{
    const name = req.body.search_book;
    
   try{
    const response = await axios.get(`https://openlibrary.org/search.json?title=${name}`);
    
    if (response.data.numFound != 0){
        const data = response.data.docs[0]
        const title = response.data.docs[0].title;
        const author = response.data.docs[0].author_name;
        const pages = response.data.docs[0].number_of_pages_median;
        let isbn = response.data.docs[0].isbn[response.data.docs[0].isbn.length - 1];
        console.log("Isbn: "+isbn)
        let image = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
       
        let image1 = await Jimp.read(image);
        let width =  image1.bitmap.width
        let i = 2
        while (width <=2 ){
            isbn = response.data.docs[0].isbn[response.data.docs[0].isbn.length - i];
            image = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
            image1 = await Jimp.read(image);
            width =  image1.bitmap.width
            i+=1
            if((response.data.docs[0].isbn.length - i)==0){
                break
            }

        }       
      
        let rating = response.data.docs[0].ratings_average
        if (rating){
            rating = rating.toFixed(2)
        }
        
        const Books1 = await books()
        res.render("/home/hannanur117/A_Project/My_Book_Collection/ejs/index.ejs",{
            
            
            appName : "MY LIBRARY",
            
            books: Books1,
            Title:title,
            Author:author,
            Pages:pages,
            ImageUrl:image,
            Data:data,
            Rating:rating

        })
    }else{
        res.render(__dirname + "/ejs/index.ejs",{
            appName : "MY LIBRARY",
           
            books: Books,
            notFound:"Not Found"
         })
    }


   }catch(error){
    console.error("Failed to make this request: ",error.message);
       res.render(__dirname + "/ejs/index.ejs", {
        error: error.message,
      })
   }

})


app.post("/data",async (req,res)=>{
    console.log(req.body)
    const title = req.body.title;
    const author = req.body.author;
    const pages = Number(req.body.pages);
    const images = req.body.images;
    const rating = parseFloat(req.body.rating);
    const read_status = req.body.reading_status
    try{
        const result = await db.query("INSERT into books (title,author,pages,rating,reading,img_url) VALUES ($1,$2,$3,$4,$5,$6);",[title,author,pages,rating,read_status,images]);
        res.redirect('/');
     }catch(error){
       
       console.error(error);
       res.status(500).send("Error fetching data")
    }
    
});


app.post("/update",async(req,res)=>{
    const id = req.body.id
    const title = req.body.title;
    const author = req.body.author;
    const pages = Number(req.body.pages);
    const images = req.body.images;
    const rating = parseFloat(req.body.rating);
    const read_status = req.body.reading_status;

    try{
        const result = await db.query("UPDATE books SET title=$1,author=$2,pages=$3,rating=$4,reading=$5,img_url=$6 WHERE id=$7 RETURNING *;",[title,author,pages,rating,read_status,images,id]);
        res.redirect('/');
     }catch(error){
       
       console.error(error);
       res.status(500).send("Error fetching data")
    }

})

app.post("/del",async(req,res)=>{
    const id = req.body.id 

    try{
        const result = await db.query("DELETE FROM books WHERE id=$1 RETURNING *;",[id]);
        res.redirect('/');
     }catch(error){
       
       console.error(error);
       res.status(500).send("Error fetching data")
    }
})
app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})