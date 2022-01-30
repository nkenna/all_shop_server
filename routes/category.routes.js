module.exports = app => {
    var tools = require('../config/utils');
    const categories = require("../controllers/category/category.controller");
  
    var router = require("express").Router();
    
 
    //router.post("/create-category", tools.authenticateToken, categories.addCategory);
    router.get("/all-categories", categories.allCategory);
    router.get("/categories-by-type", categories.categoryByType);
    router.post("/create-category", categories.addCategory);

      
    app.use('/api/v1/category', router);
        
};