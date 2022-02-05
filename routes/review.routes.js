module.exports = app => {
    var tools = require('../config/utils');
    const reviews = require("../controllers/review/review.controller");
  
    var router = require("express").Router();
    
 
    router.post("/create-review", tools.authenticateToken, reviews.createReview);
    router.post("/delete-review",  tools.authenticateToken, reviews.deleteReview);
    router.post("/edit-review", tools.authenticateToken, reviews.editReview);
    router.get("/reviews-by-business", tools.authenticateToken, reviews.reviewsByBusiness);
    router.get("/reviews-by-product", tools.authenticateToken, reviews.reviewsByProduct);
      
    app.use('/api/v1/review', router);
        
};