module.exports = app => {
    var tools = require('../config/utils');
    const product = require("../controllers/product/product.controller");
  
    var router = require("express").Router();
    
 
    router.post("/add-product", tools.authenticateToken, product.createProduct);
    router.post("/edit-product-avatar", tools.authenticateToken, product.editProductImage);
    router.post("/get-product", tools.authenticateToken, product.getAProduct);
    router.get("/get-product-by-business", tools.authenticateToken, product.getProductsByBusiness);
    router.get("/get-product-by-business", tools.authenticateToken, product.getProductsByBusiness);
    router.get("/get-product-by-plaza", tools.authenticateToken, product.getProductsByPlaza);
    router.post("/make-product-offer", tools.authenticateToken, product.makeProductOffer);
    //router.post("/make-product-offer", tools.authenticateToken, product.makeProductOffer);
    
      
    app.use('/api/v1/product', router);
        
};