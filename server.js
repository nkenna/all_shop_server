#!/usr/bin/env nodejs

const express = require("express");
const bodyParser = require('body-parser');
const formidable = require('formidable');
const cors = require("cors");
const fileUpload = require('express-fileupload');
const db = require("./models");
const os = require('os');
var fs = require('fs');
const path = require("path");
const app = express();

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles : true,
  debug: true
}));

var filesFolderAvatar = path.join(process.cwd(), 'media/images/avatars');
var filesFolderPlaza = path.join(process.cwd(), 'media/images/plaza');
var filesFolderProduct = path.join(process.cwd(), 'media/images/products');

console.log(filesFolderAvatar);
console.log(filesFolderPlaza);
console.log(filesFolderProduct);

app.use('/media-avatar', express.static(filesFolderAvatar));
app.use('/media-plaza', express.static(filesFolderPlaza));
app.use('/media-product', express.static(filesFolderProduct));


db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

  require("./routes/user.routes")(app);
  require("./routes/plaza.routes")(app);
  require("./routes/category.routes")(app);
  require("./routes/business.routes")(app);
  require("./routes/product.routes")(app);
  require("./routes/admin.routes")(app);
  


  
  //require("./app/routes/admin.routes")(app);

  app.get("/", (req, res) => {
    res.send("hello apache men");
});

const PORT = process.env.PORT || 8586;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}.`);
});