module.exports = app => {
    var tools = require('../config/utils');
    const admins = require("../controllers/admin/admin.controller");
    const adminOps = require("../controllers/admin/admin.ops.controller");
  
    var router = require("express").Router();
    
 
    router.post("/create-admin", admins.createAdmin); 
    router.post("/login-admin", admins.loginAdmin); 
    router.post("/change-admin-password", admins.changeAdminPassword); 
    router.post("/admin-profile", admins.adminProfileById); 
    router.get("/all-admins", adminOps.allAdmins); 

    router.get("/admin-all-users", adminOps.adminAllUsers); 
    router.post("/admin-flag-user", adminOps.adminFlagUnFlafUser); 

    router.get("/admin-all-plazas", adminOps.adminAllPlaza); 
    router.post("/admin-create-plaza", adminOps.addPlaza); 
    router.post("/admin-edit-plaza-location", adminOps.adminEditPlazaLocation); 

    router.post("/admin-add-business", adminOps.adminAddBusiness); 
    router.get("/admin-all-business", adminOps.adminAllBusiness); 

    router.post("/admin-add-product", adminOps.adminCreateProduct); 
    router.get("/admin-all-products", adminOps.adminAllProducts); 

    router.post("/admin-create-admin", adminOps.adminCreateAdmin); 
    
    
    app.use('/api/v1/admin', router);
        
};