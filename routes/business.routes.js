module.exports = app => {
    var tools = require('../config/utils');
    const business = require("../controllers/business/business.controller");
  
    var router = require("express").Router();
    
 
    router.post("/create-business", tools.authenticateToken, business.addBusiness);
    router.post("/get-business", tools.authenticateToken, business.getABusiness);
    router.post("/add-contact-to-business", tools.authenticateToken, business.addContactToBusiness);
    router.post("/edit-business-category", tools.authenticateToken, business.editBusinessCategory);
    router.get("/get-business-by-plaza", tools.authenticateToken, business.getBusinessByPlaza);
      
    app.use('/api/v1/business', router);
        
};