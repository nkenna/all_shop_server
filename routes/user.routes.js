module.exports = app => {
    var tools = require('../config/utils');
    const users = require("../controllers/user/user.controller");
  
    var router = require("express").Router();
    
 
    router.post("/create-user", users.createUser);
    router.post("/verify-user", users.verifyUser);
    router.post("/change-password", users.changePassword);
    router.post("/login-user", users.loginUser);
    router.post("/send-reset-code", users.sendResetCode);
    router.post("/reset-password", users.resetPassword);
    //router.post("/user-profile-by-email", users.userProfileByEmail);
    router.post("/user-profile-by-id", tools.authenticateToken, users.userProfileById);
    router.post("/edit-profile", users.editProfile);
    router.post("/edit-profile-avatar", users.editAvatar);
    //router.post("/resend-verify-email", users.resendVerification);
      
    app.use('/api/v1/user', router);
        
};