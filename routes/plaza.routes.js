module.exports = app => {
    var tools = require('../config/utils');
    const plazas = require("../controllers/plaza/plaza.controller");
  
    var router = require("express").Router();
    
 
    router.post("/create-plaza", tools.authenticateToken, plazas.addPlaza);
    router.post("/edit-plaza-location", tools.authenticateToken, plazas.editPlazaLocation);
    router.post("/get-plaza", tools.authenticateToken, plazas.getAPlaza);
    router.get("/get-plaza-home", tools.authenticateToken, plazas.homePlazaData);
    router.post("/edit-plaza-image", tools.authenticateToken, plazas.editPlazaImage);
      
    app.use('/api/v1/plaza', router);
        
};