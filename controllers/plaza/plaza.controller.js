const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Location = db.locations;
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

exports.addPlaza = (req, res) => {
    var result = {};

    var name = req.body.name;
    var detail = req.body.detail;
    var userId = req.body.userId;

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
            return res.status(404).send(result);
        }

        var plaza = new Plaza({
            name: name,
            detail: detail,
            userId: user._id,
            user: user._id
        });

        plaza.save(plaza)
        .then(newPlaza => {
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

exports.editPlazaLocation = (req, res) => {
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
    var plazaId = req.body.plazaId;

    if(!lat || !lon){
        result.status = "failed";
        result.message = "latitude and longtitude is required";
        return res.status(400).send(result); 
    }

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account does not exist";
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

exports.getAPlaza = (req, res) => {
    var result = {};

    var plazaId = req.body.plazaId;

    if(!plazaId){
        result.status = "failed";
        result.message = "plazaId is required";
        return res.status(400).send(result); 
    }

    Plaza.findOne({_id: plazaId})
    .populate("location")
    .populate("user", '-password')
    .then(plaza => {
        if(!plaza){
            result.status = "failed";
            result.message = "plaza not found";
            return res.status(404).send(result); 
        }

        result.status = "success";
        result.message = "plaza found";
        result.plaza = plaza;
        return res.status(200).send(result); 
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred plaza";
        return res.status(500).send(result);
    });


}

exports.homePlazaData = (req, res) => {
    var result = {};
    const now = moment(new Date());

    var lat = req.query.lat;
    var lng = req.query.lng;

    Location.find({
        loc: {
            $near: {
                $maxDistance: 10000000,
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            }
        }
    })
    .select("-country -state -city -address -landmark -type -user -userId")
    .populate("plaza")
    .then(locations => {
        // attach recent added stores
        Business.find({createdAt: {
            $gte: moment(now).subtract(90, 'days').toDate(),
            $lte: now.toDate()
        }})
        .sort('-updatedAt')
        .then(business => {
            console.log(locations);
            result.status = "success";
            result.message = "locations found";
            result.locations = locations;
            result.business = business;
            return res.status(200).send(result); 
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred recent stores";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding locations";
        return res.status(500).send(result);
    });
}


exports.editPlazaImage = (req, res) => {
    var result = {};

   
    let uploadPath;
    var userId = req.body.userId;
    var plazaId = req.body.plazaId;
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
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });  
}







