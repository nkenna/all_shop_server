const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const VerifyCode = db.verifycodes;
const ResetCode = db.resetcodes;
const Device = db.devices;
const Business = db.businesses;
const Product = db.products;
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

exports.createUser = (req, res) => {
    var result = {};
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var password = req.body.password;
    
    
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

    User.findOne({ email: {$regex : email, $options: 'i'}})
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
    
            var newUser = new User({
                firstname: firstname,
                lastname: lastname,
                phone: phone,
                email: email,
                password: hash
            });

                
            newUser.save(newUser)
            .then(user => {
                // create user wallet
                var wallet = new Wallet({
                    walletRef: cryptoRandomString({length: 6, type: 'alphanumeric'}) + cryptoRandomString({length: 6, type: 'alphanumeric'}),
                    userId: user._id,
                    user: user._id
                });

                wallet.save(wallet)
                .then(wa => {
                    console.log("user wallet created");
                    user.wallet = wa._id;
                    User.updateOne({_id: user._id}, user)
                    .then(wa => console.log("user updated"))
                    .catch(err => console.log("error updating user"));

                })
                .catch(err => console.log("error creating wallet"));

                result.status = "success";
                result.userId = user._id;
                result.message = "user account created successfully";
                return res.status(200).send(result);

                /**
                const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                
                client.verify.services.create({
                    friendlyName: 'dash platform',
                    codeLength: 6
                })
                .then(service => {
                    console.log(service.sid);

                    client.verify.services(service.sid)
                    .verifications
                    .create({to: phone, channel: 'sms'})
                    .then(verification => {
                        console.log(verification.status);
                        var vcode = new VerifyCode({
                            serviceId: service.sid,
                            email: user.email,
                            userId: user._id
                        });                                    
                        vcode.save(vcode)
                        .then(vc => {
                            console.log("done creating verification code");
                        
                        })
                        .catch(err => console.log("error sending email"));

                        result.status = "success";
                        result.userId = user._id;
                        result.message = "user account created successfully";
                        return res.status(200).send(result);

                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred sending verification token: " + err.message;
                        return res.status(500).send(result);
                    }); 
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred sending verification token: " + err.message;
                    return res.status(500).send(result);
                }); 
                
                **/
                                    
                
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

exports.loginUser = (req, res) => {
    var result = {};
    
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({email: email})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "account does not exist";
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
                emai: user.email,
                userId: user._id
            }
            const token = tools.generateAccessToken(data);

            var userData = {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                name: user.name,
                id: user._id,
                avatar: user.avatar,
            }

            result.user = userData;
            result.token = token;
            result.status = "success";
            result.message = "authenication success";
            return res.status(200).send(result);
        });
    
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });

}

exports.changePassword = (req, res) => {
    var result = {};

    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var userId = req.body.userId;

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

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "account does not exist";
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
                User.updateOne({_id: user._id}, user)
                .then(updateData => {
                    result.status = "success";
                    result.message = "user updated successfully";
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
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });
}

exports.userProfileById = (req, res) => {
    var result = {};

    var userId = req.body.userId;

    User.findOne({_id: userId})
    .select("-password")
    //.populate("events")
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "no user account found";
            return res.status(404).send(result);
        }

        result.status = "success";
        result.message = "user account found";
        result.user = user;
        return res.status(200).send(result);

    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });
}

exports.editProfile = (req, res) => {
    var result = {};
   
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    //var phone = req.body.phone;
    var userId = req.body.userId;
   


    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account does not exist";
            return res.status(404).send(result); 
        }

        user.firstname = firstname;
        user.lastname = lastname;
        //user.phone = phone;
        
        User.updateOne({_id: user._id}, user)
        .then(update => {
            result.status = "success";
            result.message = "user data updated successfully";
            return res.status(200).send(result); 
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred updating user";
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

exports.sendResetEmail = (req, res) => {
    var result = {};
    var email = req.body.email;

    if(!email){
        result.status = "failed";
        result.message = "email is required";
        return res.status(400).send(result);
    }

    User.findOne({email: email})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "this email is not attached to any account";
            return res.status(404).send(result);
        }

        var code = cryptoRandomString({length: 8, type: 'alphanumeric'})


        // save code
        var rcode = new ResetCode({
            code: code,
            email: user.email,
            userId: user._id
        });

        rcode.save(rcode)
        .then(rc => {
            console.log("done creating verification code");
            var emailtext = "<p>You requested to reset your password. If you did not make this request, please contact support and change your password. If not, copy and paste this code on the required field: " +
            rc.code + "</p>" +
            "<p>AllShop Team</p>";
            
            tools.sendEmail(
                user.email,
                "Reset Account password",
                emailtext
            );

            result.status = "success";
            result.message = "user reset password email sent";
            return res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred saving reset code data";
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

exports.resetPassword = (req, res) => {
    var result = {};

    var code = req.body.code;
    var password = req.body.password;

   ResetCode.findOne({code: code})
   .then(rcode => {
    if(!rcode){
        result.status = "failed";
        result.message = "invalid reset code recieved";
        return res.status(400).send(result);
    }

    User.findOne({_id: rcode.userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "no user account found";
            return res.status(404).send(result);
        }

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


exports.editUserLocation = (req, res) => {
    var result = {};
   
    var address = req.body.address;
    var city = req.body.city;
    var state = req.body.state;
    var country = req.body.country;
    var landmark = req.body.landmark;
    var lat = req.body.lat;
    var lon = req.body.lon;
    var userId = req.body.userId;
    var locationId = req.body.locationId;

   

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account does not exist";
            return res.status(404).send(result); 
        }

        Location.findOne({_id: locationId})
        .then(location => {
            if(!location){ // create new location
                var loc = new Location({
                    country: country,
                    state: state,
                    city: city,
                    address: address,
                    landmark: landmark,
                    lat: lat,
                    lon: lon,
                    userId: user._id,
                    user: user._id
                });

                loc.save(loc)
                .then(newLoc => {
                    result.status = "success";
                    result.message = "user location added successfuly";
                    return res.status(200).send(result); 
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred saving user location";
                    return res.status(500).send(result);
                });
            }

            location.address = address;
            location.city = city;
            location.state = state;
            location.country = country;
            location.landmark = landmark;
            location.lat = lat;
            location.lon = lon;
            location.userId = user._id;
            location.user = user;

            Location.updateOne({_id: locationId}, location)
            .then(update => {
                result.status = "success";
                result.message = "user location data updated successfully";
                return res.status(200).send(result); 
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred updating user location";
                return res.status(500).send(result);
            });

        })   
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding location";
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

exports.addUpdateDevice = (req, res) => {
    var result = {};

    var token = req.body.token;
    var deviceModel = req.body.deviceModel;
    var os = req.body.os;
    var userId = req.body.userId;

    if(!token){
        result.status = "failed";
        result.message = "device token is required";
        return res.status(400).send(result) 
    }

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user not found";
            return res.status(404).send(result);
        }

        Device.findOne({userId: userId})
        .then(device => {
            if(!device){
                var dd = new Device({
                    token: token,
                    deviceModel: deviceModel,
                    os: os,
                    userId: user._id,
                    user: user._id,
                });

                dd.save(dd)
                .then(data => {
                    result.status = "success";
                    result.message = "device data saved";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error saving device data";
                    return res.status(500).send(result);
                });
            }else{
                // device was found, update
                device.token = token;
                device.deviceModel = deviceModel;
                device.os = os;
                Device.updateOne({_id: device._id}, device)
                .then(data => {
                    result.status = "success";
                    result.message = "device data updated";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error updating device data";
                    return res.status(500).send(result);
                });

            }
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error finding device data";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error finding user";
        return res.status(500).send(result);
    });
}


exports.profileData = (req, res) => {
    var result = {};

    var userId = req.query.userId;

    // count stores by user
    Business.countDocuments({userId: userId})
    .then(numberOfBusiness => {
        console.log(numberOfBusiness);
        // count products by user
        Product.countDocuments({userId: userId})
        .then(numberOfProducts => {
            console.log(numberOfProducts);
            result.status = "success";
            result.message = "data retrieved";
            result.numberOfBusiness = numberOfBusiness;
            result.numberOfProducts = numberOfProducts;
            return res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred counting products";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred counting stores";
        return res.status(500).send(result);
    });
}