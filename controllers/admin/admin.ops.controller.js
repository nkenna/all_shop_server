const db = require(process.cwd() + "/models");
const User = db.users;
const Admin = db.admins;
const Plaza = db.plazas;
const Location = db.locations;
const Category = db.categories;
const Business = db.businesses;
const Product = db.products;
const Device = db.devices;
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


exports.adminAllUsers = (req, res) => {
    var result = {};

    var adminId = req.query.adminId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        User.find()
        .then(initUsers => {
            User.find()
            .select("-password")
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .then(users => {
                result.status = "success";
                result.message = "users found: " + users.length;
                result.total = initUsers.length;
                result.page = page;
                result.perPage = perPage;
                result.users = users;
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding users";
                return res.status(500).send(result);
            });        
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred getting users";
            return res.status(500).send(result);
        });
    })

    
}

exports.adminFlagUnFlafUser = (req, res) => {
    var result = {};
    var adminId = req.body.adminId;
    var userId = req.body.userId
    var status = req.body.status;

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        User.findOne({_id: userId})
        .then(user => {
            if(!user){
                result.status = "failed";
                result.message = "user not found";
                return res.status(404).send(result); 
            }

            user.status = status;
            User.updateOne({_id: user._id}, user)
            .then(data => {
                // send push notication to user device
                Device.findOne({userId: user._id})
                .then(device => {
                    if(device){
                        // device was found. create message
                        var msg = status == false ? "Your account have been flagged. Contact support for assistance." : "Your account have been unflagged successfully. You can now enjoy AllShop Platform.";
                        tools.pushMessageToDevice(device.token, "IMPORTANT MESSAGE", msg);
                    }
                })
                .catch(err => console.log("erroring finding user device: " + err));
                result.status = "success";
                result.message = status == false ? "user flagged successfully" : "user unflagged successfully";
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


    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });

}

exports.adminGetUserProfileById = (req, res) => {
    var result = {};

    var userId = req.body.userId;
    var adminId = req.body.adminId;

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

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
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admin";
        return res.status(500).send(result);
    });

    
}

exports.adminAllPlaza = (req, res) => {
    var result = {};

    var adminId = req.query.adminId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        Plaza.find()
        .then(initPlazas => {
            Plaza.find()
            .populate("location")
            .populate("user", '-password')
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .sort('-createdAt')
            .then(plazas => {
                result.status = "success";
                result.message = "plazas found: " + plazas.length;
                result.total = initPlazas.length;
                result.page = page;
                result.perPage = perPage;
                result.plazas = plazas;
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding plaza";
                return res.status(500).send(result);
            });        
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred getting plazas";
            return res.status(500).send(result);
        });
    })

    
}

exports.addPlaza = (req, res) => {
    var result = {};

    var name = req.body.name;
    var detail = req.body.detail;
    var adminId = req.body.adminId;

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result);
        }

        var plaza = new Plaza({
            name: name,
            detail: detail,
            adminId: admin._id,
            admin: admin._id
        });

        plaza.save(plaza)
        .then(newPlaza => {
            // send push notication to user device
            Device.findOne({userId: user._id})
            .then(device => {
                if(device){
                    // device was found. create message
                    var msg = status == false ? "Your account have been flagged. Contact support for assistance." : "Your account have been unflagged successfully. You can now enjoy AllShop Platform.";
                    tools.pushMessageToDevice(device.token, "IMPORTANT MESSAGE", msg);
                }
            })
            .catch(err => console.log("erroring finding user device: " + err));
            result.status = "success";
            result.message = "new plaza created successfully";
            result.plaza = newPlaza;
            return res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred creating plaza";
            return res.status(500).send(result);
        });
    })


}

exports.adminEditPlazaLocation = (req, res) => {
    var result = {};
   
    var address = req.body.address;
    var city = req.body.city;
    var state = req.body.state;
    var country = req.body.country;
    var landmark = req.body.landmark;
    var lat = req.body.lat;
    var lon = req.body.lon;
    var adminId = req.body.adminId;
    var locationId = req.body.locationId;   
    var plazaId = req.body.plazaId;

    if(!lat || !lon){
        result.status = "failed";
        result.message = "latitude and longtitude is required";
        return res.status(400).send(result); 
    }

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account does not exist";
            return res.status(404).send(result); 
        }

        Plaza.findOne({_id: plazaId})
        .then(plaza => {
            if(!plaza){
                result.status = "failed";
                result.message = "plaza data not found";
                return res.status(404).send(result); 
            }

            console.log(lon);

            const locationToUse = { type: 'Point', coordinates: [lon, lat] };

            console.log(locationToUse);

            Location.findOne({_id: locationId})
            .then(location => {
                if(!location){ // create new location
                    var loc = new Location({
                        country: country,
                        state: state,
                        city: city,
                        address: address,
                        landmark: landmark,
                        loc: locationToUse,
                        plazaId: plaza._id,
                        plaza: plaza._id,
                        type: "plaza"
                    });

                    loc.save(loc)
                    .then(newLoc => {

                        // update the plaza status
                        plaza.status = true;
                        plaza.locationId = newLoc._id;
                        plaza.location = newLoc._id;
                        Plaza.updateOne({_id: plaza._id}, plaza)
                        .then(data => console.log("plaza updated successfully"))
                        .catch(err => console.log("plaza update failed: " + err));
                        
                        result.status = "success";
                        result.message = "plaza location added successfuly";
                        return res.status(200).send(result); 
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred saving plaza location";
                        return res.status(500).send(result);
                    });
                }

                else{
                    location.address = address;
                    location.city = city;
                    location.state = state;
                    location.country = country;
                    location.landmark = landmark;
                    location.loc = locationToUse,
                    location.plazaId = plaza._id;
                    location.plaza = plaza._id;
                    location.type = "plaza";

                    Location.updateOne({_id: locationId}, location)
                    .then(update => {
                        // update the plaza status
                        plaza.status = true;
                        plaza.locationId = location._id;
                        plaza.location = location._id;
                        Plaza.updateOne({_id: plaza._id}, plaza)
                        .then(data => console.log("plaza updated successfully"))
                        .catch(err => console.log("plaza update failed: " + err));

                        result.status = "success";
                        result.message = "plaza location data updated successfully";
                        return res.status(200).send(result); 
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred updating plaza location";
                        return res.status(500).send(result);
                    });
                }

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
            result.message = "error occurred finding plaza";
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

exports.adminAddPlazaImage = (req, res) => {
    var result = {};
    console.log(req.files);
    console.log(req);

   
    let uploadPath;
    var adminId = req.body.adminId;
    var plazaId = req.body.plazaId;
    var avatar = req.files.avatar; 
    

    if (!req.files || Object.keys(req.files).length === 0) {
        result.status = "failed";
        result.message = "image fields cannot be empty";
        return res.status(400).send(result);
    }


    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin not found";
            return res.status(404).send(result);
        }

        Plaza.findOne({_id: plazaId})
        .then(plaza => {
            if(!plaza){
                result.status = "failed";
                result.message = "plaza not found";
                return res.status(404).send(result);
            }

            uploadPath = path.join(process.cwd(), '/media/images/plaza/' +  avatar.name); //__dirname + '/images/avatars/' + avatar.name;
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
                    newName = plaza._id + '.jpg';
                }else if(avatar.mimetype == 'image/png'){
                    newName = plaza._id + '.png';
                }else if (avatar.mimetype == 'image/gif') {
                    newName = plaza._id + '.gif';
                }else {
                    newName = plaza._id + '.png';
                }
                
                // we need to rename here   
                var newPath = path.join(process.cwd(), '/media/images/plaza/' + newName);  
                fs.rename(uploadPath, newPath, function(err) {
                    if (err) {
                        result.status = "failed";
                        result.message = "avatar upload not successful: " + err;
                        return res.status(500).send(result);
                    }
                    console.log("Successfully renamed the avatar!");

                    // update product avatar field
                    var imageData = {
                        imageUrl: "media-plaza/" + newName,
                        imageName: newName,
                        imageType: avatar.mimetype,
                        
                    };

                    
                    plaza.images.push(imageData);
                    Plaza.updateOne({_id: plaza._id}, plaza)
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
            result.message = "error occurred finding plaza";
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

exports.adminAddBusiness = (req, res) => {
    var result = {};
    
    var name = req.body.name;
    var detail = req.body.detail;
    var adminId = req.body.adminId;
    var plazaId = req.body.plazaId;
    var categoryId = req.body.categoryId;

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result);
        }

        // find Plaza
        Plaza.findOne({_id: plazaId})
        .then(plaza => {
            if(!plaza){
                result.status = "failed";
                result.message = "plaza data not found";
                return res.status(404).send(result);
            }

            if(plaza.location == null){
                result.status = "failed";
                result.message = "plaza location required";
                return res.status(403).send(result);
            }

            // find Category
            Category.findOne({_id: categoryId})
            .then(category => {
                if(!category){
                    result.status = "failed";
                    result.message = "category data not found";
                    return res.status(404).send(result);
                }

                // create business
                var business = new Business({
                    name: name,
                    detail: detail,
                    adminId: admin._id,
                    plazaId: plaza._id,
                    categoryId: category._id,
                    category: category._id,
                    plaza: plaza._id,
                    admin: admin._id,
                    locationId: plaza.location,
                    location: plaza.location,
                });

                business.save(business)
                .then(newBusiness => {
                    result.status = "success";
                    result.business = newBusiness;
                    result.message = "business created successfully";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred saving business";
                    return res.status(500).send(result);
                });
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred business category";
                return res.status(500).send(result);
            });
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding plaza";
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

exports.adminAllBusiness = (req, res) => {
    var result = {};

    var adminId = req.query.adminId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        Business.find()
        .then(initBusinesses => {
            Business.find()
            .skip((perPage * page) - perPage)
            .limit(perPage) 
            .populate('contacts')
            .populate('category')
            .populate('location')
            .populate('plaza', {name: 1})
            .populate('admin', {firstname: 1, lastname: 1, role: 1})
            .populate('user', {firstname: 1, lastname: 1})
            .sort('-createdAt')
            .then(businesses => {
                result.status = "success";
                result.message = "businesses found: " + businesses.length;
                result.total = initBusinesses.length;
                result.page = page;
                result.perPage = perPage;
                result.businesses = businesses;
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding businesses by plaza";
                return res.status(500).send(result);
            });        
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred getting total businesses by plaza";
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


exports.adminCreateProduct = (req, res) => {
    var result = {};

    var name = req.body.name;
    var detail =  req.body.detail;
    var minPrice = req.body.minPrice;
    var maxPrice = req.body.maxPrice;
    var onlineLinks = req.body.onlineLinks;
    var businessId = req.body.businessId;
    var adminId = req.body.adminId;
    var categoryId = req.body.categoryId;

    if(!name){
        result.status = "failed";
        result.message = "product name is required";
        return res.status(400).send(result);
    }

    if(!categoryId){
        result.status = "failed";
        result.message = "product category Id is required";
        return res.status(400).send(result);
    }

    if(!businessId){
        result.status = "failed";
        result.message = "store/business Id is required";
        return res.status(400).send(result);
    }

    Business.findOne({_id: businessId})
    .then(business => {
        if(!business){
            result.status = "failed";
            result.message = "business not found";
            return res.status(404).send(result);
        } 

        Admin.findOne({_id: adminId})
        .then(admin => {
            if(!business){
                result.status = "failed";
                result.message = "admin not found";
                return res.status(404).send(result);
            } 

            Category.findOne({_id: categoryId})
            .then(category => {
                if(!category){
                    result.status = "failed";
                    result.message = "product category not found";
                    return res.status(404).send(result);
                }

                if(category.type != 'product'){
                    result.status = "failed";
                    result.message = "category is not of type product";
                    return res.status(400).send(result);
                }

                var product = new Product({
                    name: name,
                    detail: detail,
                    ref: cryptoRandomString({length: 4, type: 'alphanumeric'}) + cryptoRandomString({length: 4, type: 'alphanumeric'}) + cryptoRandomString({length: 4, type: 'alphanumeric'}),
                    minPrice: minPrice,
                    maxPrice: maxPrice,
                    onlineLinks: onlineLinks,
                    businessId: business._id,
                    adminId: admin._id,
                    categoryId: category._id,
                    locationId: business.location,
                    category: category._id,
                    business: business._id,
                    plazaId: business.plazaId,
                    plaza: business.plazaId,
                    location: business.location,
                    admin: admin._id,
                });

                product.save(product)
                .then(newProduct => {
                    result.status = "success";
                    result.product = newProduct;
                    result.message = "new product added succesfully";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred adding product";
                    return res.status(500).send(result);
                });
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding category";
                return res.status(500).send(result);
            });

        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding admin";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding business";
        return res.status(500).send(result);
    });


}

exports.adminAllProducts = (req, res) => {
    var result = {};

    var adminId = req.query.adminId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        Product.find()
        .then(initProducts => {
            Product.find()
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .populate('category')
            .populate('location')
            .populate('business', {name: 1})
            .populate('plaza', {name: 1})
            .populate('admin', {firstname: 1, lastname: 1, role: 1})
            .populate('user', {firstname: 1, lastname: 1})
            .sort('-createdAt')
            .then(products => {
                result.status = "success";
                result.message = "products found: " + products.length;
                result.total = initProducts.length;
                result.page = page;
                result.perPage = perPage;
                result.products = products;
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding products by business";
                return res.status(500).send(result);
            });        
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred getting total products by business";
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

exports.allAdmins = (req, res) => {
    var result = {};

    Admin.find()
    .select("-password")
    .then(admins => {
        result.status = "success";
        result.admins = admins;
        result.message = "admins found: " + admins.length;
        return res.status(200).send(result);
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding admins";
        return res.status(500).send(result);
    });
}

exports.adminCreateAdmin = (req, res) => {
    var result = {};
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var password = "1234567890";
    var role = req.body.role;
    var adminId = req.body.adminId;

    if(!role){
        result.status = "failed";
        result.message = "admin role is required";
        return res.status(400).send(result);
    }


        
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

    Admin.findOne({_id: adminId})
    .then(admin => {
        if(!admin){
            result.status = "failed";
            result.message = "admin account not found";
            return res.status(404).send(result); 
        }

        // check admin role        
        if(admin.role != 'super admin' && admin.role != 'manager'){
            result.status = "failed";
            result.message = "admin role must be super admin, manager to create another admin";
            return res.status(403).send(result);
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
    

    })

     
}