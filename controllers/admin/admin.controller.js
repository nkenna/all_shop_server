const db = require(process.cwd() + "/models");
const User = db.users;
const Admin = db.admins;
const Wallet = db.wallets;
const VerifyCode = db.verifycodes;
const ResetCode = db.resetcodes;
const os = require('os');
var fs = require('fs');
const path = require("path");

var mime = require('mime');
var tools = require(process.cwd() + '/config/utils');
const cryptoRandomString = require('crypto-random-string');
const moment = require("moment");
const bcrypt = require('bcrypt');
const saltRounds = 10;
var AdminFB = require("firebase-admin");
const twilio = require('twilio');

exports.createAdmin = (req, res) => {
    var result = {};
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var password = "1234567890";
    var role = req.body.role;

    if(!role){
        result.status = "failed";
        result.message = "admin role is required";
        return res.status(400).send(result);
    }


    /*
    if(role != 'super admin' || role != 'manager' || role != 'staff'){
        result.status = "failed";
        result.message = "admin role must be super admin, manager or staff";
        return res.status(400).send(result);
    }
    */
    
    if(!email){
        result.status = "failed";
        result.message = "email is required";
        return res.status(400).send(result);
    }

    if(!password){
        result.status = "failed";
        result.message = "password is required";
        return res.status(400).send(result);
    }

    if(password.length < 8){
        result.status = "failed";
        result.message = "password length must be equal to or greater than 8 characters.";
        return res.status(400).send(result);
    }

    Admin.findOne({ email: {$regex : email, $options: 'i'}})
    .then(userd => {
        if(userd){
            result.status = "failed";
            result.message = "email already exist. Try another email or login with this account";
            return res.status(409).send(result); 
        }

        bcrypt.hash(password, saltRounds, (err, hash) => {
            // Now we can store the password hash in db.
            if(err){
                result.status = "failed";
                result.message = "unknown error occurred - password hash failed";
                return res.status(500).send(result);
            }
    
            var newAdmin = new Admin({
                firstname: firstname,
                lastname: lastname,
                phone: phone,
                email: email,
                password: hash,
                role: role
            });

                
            newAdmin.save(newAdmin)
            .then(admin => {
                
                result.status = "success";
                result.message = "admin account created successfully";
                return res.status(200).send(result);
  
                                    
                
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred creating admin account";
                return res.status(500).send(result);
            });
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding this email";
        return res.status(500).send(result);
    });    
}

exports.verifyUser = (req, res) => {
    var result = {};

    var code = req.body.code;
    var userId = req.body.userId;

    if(!code){
        result.status = "failed";
        result.message = "invalid verification code - empty code";
        return res.status(400).send(result);
    }

   
    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user not found";
            return res.status(404).send(result);
        }

        // use twilio to verify
        VerifyCode.findOne({userId: user._id})
        .then(vc => {
            if(!vc){
                result.status = "failed";
                result.message = "verification data not found";
                return res.status(404).send(result);
            }            

            const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

            client.verify.services(vc.serviceId)
            .verificationChecks
            .create({to: user.phone, code: code})
            .then(verification_check => {
                console.log(verification_check.status);

                if(verification_check.status == "approved" && verification_check.valid == true){
                    // provided code is valid
                    user.verified = true;
                    User.updateOne({_id: user._id}, user)
                    .then(vidd => console.log("done"))
                    .catch(err => console.log("error updating user"));

                    // delete verification code data
                    VerifyCode.deleteOne({userId: userId})
                    .then(vidd => console.log("done deleting"))
                    .catch(err => console.log("error verification code data"));

                    var emailtext = "<p>Dear, " + user.firstname + "</p>" +
                            "You are indeed welcome to Dash." +
                            "<p>Thanks, Dash Team</p>"
                    
                    tools.sendEmail(
                        user.email,
                        "Dash welcomes you",
                        emailtext
                    );

                    var userData = {
                        id: user._id,
                        email: user.email,
                        avatar: user.avatar,
                        firstname: user.firstname,
                        lastname: user.lastname
                    }                

                    result.status = "success";
                    result.user = userData;
                    result.message = "user verified successfully";
                    return res.status(200).send(result);

                }else{
                    result.status = "failed";
                    result.message = "user account verification failed. invalid code.";
                    return res.status(417).send(result);
                }
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred verifying user";
                return res.status(500).send(result);
            });


        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding verification data";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });

    
}

exports.loginAdmin = (req, res) => {
    var result = {};
    
    var email = req.body.email;
    var password = req.body.password;

    console.log(email);

    /*if(password == '1234567890'){
        result.status = "failed";
        result.message = "you cannot make use of this password. Change your password";
        return res.status(403).send(result);
    }*/

    Admin.findOne({email: email})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "admin does not exist";
            return res.status(404).send(result); 
        }

        // match user password since user exist
        bcrypt.compare(password, user.password, (err, resx) => {
            // if res == true, password matched
            // else wrong password
            if(resx == false){
                result.status = "failed";
                result.message = "wrong account credentials";
                return res.status(401).send(result);
            }


           /* if(user.verified == false){
                result.status = "failed";
                result.message = "unverified account";
                return res.status(423).send(result);
            } */

            if(user.status == false){
                result.status = "failed";
                result.message = "flagged account";
                return res.status(403).send(result);
            }

            // everything seems alright, generate token
            var data = {
                email: user.email,
                userId: user._id,
                role: user.role
            }
            const token = tools.generateAccessToken(data);

            var userData = {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                name: user.name,
                id: user._id,
                role: user.role,
            }

            result.admin = userData;
            result.token = token;
            result.status = "success";
            result.message = "authenication success";
            return res.status(200).send(result);
        });
    
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });

}

exports.changeAdminPassword = (req, res) => {
    var result = {};

    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var adminId = req.body.adminId;

    if(!newPassword){
        result.status = "failed";
        result.message = "password is required";
        return res.status(400).send(result);
    }

    if(newPassword.length < 8){
        result.status = "failed";
        result.message = "password length must be equal to or greater than 8 characters.";
        return res.status(400).send(result);
    }

    Admin.findOne({_id: adminId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "admin account does not exist";
            return res.status(404).send(result); 
        }

        bcrypt.compare(currentPassword, user.password, (err, resx) => {
            if(err){
                result.status = "failed";
                result.message = "error occurred changing password";
                return res.status(500).send(result);
            }

            if(resx == false){
                result.status = "failed";
                result.message = "wrong current password supplied";
                return res.status(401).send(result);
            }

            // change password
            bcrypt.hash(newPassword, saltRounds, (errx, hash) => {
                if(errx){
                    result.status = "failed";
                    result.message = "error occurred changing password";
                    return res.status(500).send(result);
                }

                user.password = hash;
                Admin.updateOne({_id: user._id}, user)
                .then(updateData => {
                    result.status = "success";
                    result.message = "admin password updated successfully";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred during operation";
                    return res.status(500).send(result);
                });

            })
        })
       
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });
}

exports.adminProfileById = (req, res) => {
    var result = {};

    var adminId = req.body.adminId;

    Admin.findOne({_id: adminId})
    .select("-password")
    //.populate("events")
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "no user account found";
            return res.status(404).send(result);
        }

        result.status = "success";
        result.message = "admin account found";
        result.admin = user;
        return res.status(200).send(result);

    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });
}

exports.editAdminProfile = (req, res) => {
    var result = {};
   
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var adminId = req.body.adminId;
   


    Admin.findOne({_id: adminId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account does not exist";
            return res.status(404).send(result); 
        }

        user.firstname = firstname;
        user.lastname = lastname;
        user.phone = phone;
        
        Admin.updateOne({_id: user._id}, user)
        .then(update => {
            result.status = "success";
            result.message = "admin data updated successfully";
            return res.status(200).send(result); 
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred updating admin";
            return res.status(500).send(result);
        });

    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });
}

exports.editAvatar = (req, res) => {
    var result = {};

   
    let uploadPath;
    var userId = req.body.userId;
    var avatar = req.files.avatar;    

    if (!req.files || Object.keys(req.files).length === 0) {
        result.status = "failed";
        result.message = "image fields cannot be empty";
        return res.status(400).send(result);
    }


    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user not found";
            return res.status(404).send(result);
        }

        uploadPath = path.join(process.cwd(), '/media/images/avatars/user/' +  avatar.name); //__dirname + '/images/avatars/' + avatar.name;
        console.log(avatar.mimetype);
        console.log(process.cwd()); 

         // Use the mv() method to place the file somewhere on your server
        avatar.mv(uploadPath, function(err) {
            if (err){
                result.status = "failed";
                result.message = "error moving file: " + err;
                return res.status(500).send(result);
            }


            // create filename
            var newName = '';
            if(avatar.mimetype == 'image/jpeg'){
                newName = user._id + '_' + 'avatar' + '.jpg';
            }else if(avatar.mimetype == 'image/png'){
                newName = user._id + '_' + 'avatar' + '.png';
            }else if (avatar.mimetype == 'image/gif') {
                newName = user._id + '_' + 'avatar' + '.gif';
            }else {
                newName = user._id + '_' + 'avatar' + '.png';
            }
            
            // we need to rename here   
            var newPath = path.join(process.cwd(), '/media/images/avatars/user/' + newName);  
            fs.rename(uploadPath, newPath, function(err) {
                if (err) {
                    result.status = "failed";
                    result.message = "avatar upload not successful: " + err;
                    return res.status(500).send(result);
                }
                console.log("Successfully renamed the avatar!");

                // update user avatar field
                user.avatar = "media-avatar-user/" + newName;
                User.updateOne({_id: user._id}, user)
                .then(data => {
                    result.status = "success";
                    result.message = "avatar uploaded successful";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred uploading avatar";
                    return res.status(500).send(result);
                });
                
            });

        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });  
}

exports.sendResetCode = (req, res) => {
    var result = {};
    var phone = req.body.phone;

    if(!phone){
        result.status = "failed";
        result.message = "email is required";
        return res.status(400).send(result);
    }

    User.findOne({phone: phone})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user not found";
            return res.status(404).send(result);
        }

        const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                
        client.verify.services.create({
            friendlyName: 'dash reset',
            codeLength: 6
        })
        .then(service => {
            console.log(service.sid); 
                client.verify.services(service.sid)
                    .verifications
                    .create({to: phone, channel: 'sms'})
                    .then(verification => {
                        console.log(verification.status);                                    
                        
                        var rcode = new ResetCode({
                            serviceId: service.sid,
                            //code: cryptoRandomString({length: 6, type: 'alphanumeric'}),
                            email: user.email,
                            userId: user._id
                        });
        
                        rcode.save(rcode)
                        .then(vc => {
                            console.log("done creating reset code");
                        
                        })
                        .catch(err => console.log("error creating reset code")); 

                        result.status = "success";
                        result.message = "reset code have been sent through sms";
                        return res.status(200).send(result);
                        

                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred sending reset code: " + err.message;
                        return res.status(500).send(result);
                    });                  
                
                    
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred initializing sms service: " + err.message;
            return res.status(500).send(result);
        }); 

             
       
    });
}

exports.resetPassword = (req, res) => {
    var result = {};

    var code = req.body.code;
    var password = req.body.password;
    var userId = req.body.userId;


   ResetCode.findOne({userId: userId})
   .then(rcode => {
    if(!rcode){
        result.status = "failed";
        result.message = "invalid reset code recieved";
        return res.status(400).send(result);
    }

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "no user account found";
            return res.status(404).send(result);
        }

        const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

            client.verify.services(vc.serviceId)
            .verificationChecks
            .create({to: phone, code: code})
            .then(verification_check => {
                console.log(verification_check.status);

                if(verification_check.status == "approved" && verification_check.valid == true){
                    // provided code is valid

                    bcrypt.hash(password, saltRounds, (err, hashed) => {
                        if(err){
                            result.status = "failed";
                            result.message = "unknown error occurred - password hash failed";
                            return res.status(500).send(result);
                        }
            
                        user.password = hashed;
                        User.updateOne({_id: user._id}, user)
                        .then(data => {
                            result.status = "success";
                            result.message = "password reset was successful. Procees to login";
                            return res.status(200).send(result);
                        })
                        .catch(err => {
                            console.log(err);
                            result.status = "failed";
                            result.message = "error occurred resetting password";
                            return res.status(500).send(result);
                        });
            
                    });

                }else{
                    result.status = "failed";
                    result.message = "user account verification failed. invalid code.";
                    return res.status(417).send(result);
                }
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred verifying user";
                return res.status(500).send(result);
            });

        
    }).catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });


   })
   .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding code";
        return res.status(500).send(result);
    });

    
}



