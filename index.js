const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { v4: uuidv4 } = require("uuid");
const FILE_PATH = "./books.json";
const loadBooks = () => {
  try {
    const data = fs.readFileSync(FILE_PATH);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveBooks = (books) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(books, null, 4));
};
let k = 0;

const handlePutRequest = (req, res, id) => {
  let body = '';
  req.on('data', chunk => {
      body += chunk.toString();
  });
  req.on('end', () => {
      const updatedData = JSON.parse(body);
      const books = loadBooks();
      
      const bookIndex = books.findIndex(book => book.id === parseInt(id));
      if (bookIndex !== -1) {
          books[bookIndex] = { ...books[bookIndex], ...updatedData };
          saveBooks(books);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(books[bookIndex]));
      } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Book not found' }));
      }
  });
};

const readBooksFromFile = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(FILE_PATH, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};

const writeBooksToFile = (books) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(FILE_PATH, JSON.stringify(books, null, 2), "utf8", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const server = http.createServer((req, res) => {
  if (req.url === "/books") {
  
    res.end(fs.readFileSync("books.json", "utf-8"));
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname.split("/");
  const path1=parsedUrl.pathname;
  

  if (req.method === "GET" && path[1] === "books" && path[2]) {
    const bookId = parseInt(path[2]);
    console.log(path[2]);
    fs.readFile("books.json", "utf8", (err, data) => {
      if (err) {
        res.end("Server Error");
        return;
      }

      const books = JSON.parse(data);
      const book = books.find((b) => b.id === bookId);

      if (book) {
        res.end(JSON.stringify(book));
      } else {
        res.statusCode = 404;
     
        res.end("Ma'lumot topilmadi");
      }
    });
  }
  if (req.method === "POST" && req.url === "/books") {
    let body = "";

    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const { title, author } = JSON.parse(body);

            if (!title || !author) {
                console.log('Title kiriting');
                console.log("Title yoki author yo'q.");
               res.writeHead(400, { 'Content-Type': 'text/plain' });
               res.write("Title va author kiritilishi kerak.");
                return res.end();
            }

            const books = await readBooksFromFile();
            const existingBook = books.find((book) => book.title === title);

            if (existingBook) {
                console.log('Postda muammo bor');
                console.log("Bu kitob allaqachon mavjud.");
              //  res.writeHead(409, { 'Content-Type': 'text/html' });
                res.write("<h1>Bu kitob bazada mavjud.</h1>");
                return res.end();
            }

            const newBook = {
                id: books.length + 1,
                title,
                author,
            };

            books.push(newBook);
            console.log(newBook.id);
            await writeBooksToFile(books);
            console.log("Yangi kitob qo'shildi.");
          //  res.writeHead(201, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(newBook));
            return res.end();
        } catch (error) {
            console.log("Xato yuz berdi:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: "Ichki server xatosi." }));
            return res.end();
        }
    });
}
  if (req.method === 'PUT' && path1.startsWith('/books/')) {
    const id = path1.split('/')[2];
    if (id) {
        handlePutRequest(req, res, id);
    } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid book id' }));
    }
}

if (path1.startsWith('/books/') && req.method === 'DELETE') {
  const id = parseInt(path1.split('/')[2]);

  if (!isNaN(id)) {
    fs.readFile('books.json', 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        return;
      }

      let books = JSON.parse(data);
      const bookIndex = books.findIndex(book => book.id === id);

      if (bookIndex !== -1) {
        books.splice(bookIndex, 1);
        fs.writeFile('books.json', JSON.stringify(books, null, 2), (err) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Book deleted successfully' }));
        });
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Book not found' }));
      }
    });
  } else {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Invalid book ID' }));
  }
}


 
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("server ishladi");
});
