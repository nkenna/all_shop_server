const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Business = db.businesses;
const Category = db.categories;
const Contact = db.contacts;
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

exports.addBusiness = (req, res) => {
    var result = {};
    
    var name = req.body.name;
    var detail = req.body.detail;
    var userId = req.body.userId;
    var plazaId = req.body.plazaId;
    var categoryId = req.body.categoryId;

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
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
                    userId: user._id,
                    plazaId: plaza._id,
                    categoryId: category._id,
                    category: category._id,
                    plaza: plaza._id,
                    user: user._id,
                    locationId: plaza._id,
                    location: plaza._id,
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
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });


}

exports.getABusiness = (req, res) => {
    var result = {};

    var businessId = req.body.businessId;

    if(!businessId){
        result.status = "failed";
        result.message = "businessId is required";
        return res.status(400).send(result); 
    }

    Business.findOne({_id: businessId})
    .populate("location")
    .populate("plaza")
    .populate("category")
    .populate("user", '-password')
    .then(business => {
        if(!business){
            result.status = "failed";
            result.message = "business not found";
            return res.status(404).send(result); 
        }

        result.status = "success";
        result.message = "business found";
        result.business = business;
        return res.status(200).send(result); 
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred business";
        return res.status(500).send(result);
    });


}

exports.editBusiness = (req, res) => {
   var result = {};
   
   var name = req.body.name;
   var detail = req.body.detail;
   var businessId = req.body.businessId;
   var userId = req.body.userId;
   var plazaId = req.body.plazaId;

   User.findOne({_id: userId})
   .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
            return res.status(404).send(result);
        }

        Plaza.findOne({_id: plazaId})
        .then(plaza => {
            if(!user){
                result.status = "failed";
                result.message = "plaza data not found";
                return res.status(404).send(result);
            }

            // find business
            Business.findOne({_id: businessId})
            .then(business => {
                if(!user){
                    result.status = "failed";
                    result.message = "business data not found";
                    return res.status(404).send(result);
                }

                if(business.userId != user._id){
                    result.status = "failed";
                    result.message = "you are not allowed to edit this business";
                    return res.status(403).send(result);
                }

                // update business
                business.name = name;
                business.detail = detail;
                business.plazaId =  plaza._id;
                business.plaza = plaza._id;

                Business.updateOne({_id: business._id}, business)
                .then(updated => {
                    result.status = "success";
                    result.message = "business updated successfully";
                    return res.status(200).send(result); 
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred updating business";
                    return res.status(500).send(result);
                });
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding business";
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

exports.editBusinessCategory = (req, res) => {
    var result = {};
   
    var categoryId = req.body.categoryId;
    var businessId = req.body.businessId;
    var userId = req.body.userId;

    User.findOne({_id: userId})
    .then(user => {
            if(!user){
                result.status = "failed";
                result.message = "user account not found";
                return res.status(404).send(result);
            }

            Category.findOne({_id: categoryId})
            .then(category => {
                if(!category){
                    result.status = "failed";
                    result.message = "category data not found";
                    return res.status(404).send(result);
                }

                // find business
                Business.findOne({_id: businessId})
                .then(business => {
                    if(!user){
                        result.status = "failed";
                        result.message = "business data not found";
                        return res.status(404).send(result);
                    }

                    if(business.userId != user._id){
                        result.status = "failed";
                        result.message = "you are not allowed to edit this business";
                        return res.status(403).send(result);
                    }

                    // update business
                    business.categoryId = category._id;
                    business.category = category._id;

                    Business.updateOne({_id: business._id}, business)
                    .then(updated => {
                        result.status = "success";
                        result.message = "business updated successfully";
                        return res.status(200).send(result); 
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred updating business";
                        return res.status(500).send(result);
                    });
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred finding business";
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
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });

}

exports.addContactToBusiness = (req, res) => {
    var result = {};

    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var phone1 = req.body.phone1;
    var phone2 = req.body.phone2;
    var email = req.body.email;
    var website = req.body.website;
    var facebook = req.body.facebook;
    var whatsapp = req.body.whatsapp;
    var twitter = req.body.twitter;
    var instagram = req.body.instagram;
    var tiktot = req.body.tiktot;
    var businessId = req.body.businessId;
    var userId = req.body.userId;


    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
            return res.status(404).send(result);
        }

        // find business
        Business.findOne({_id: businessId})
        .then(business => {
            if(!business){
                result.status = "failed";
                result.message = "business not found";
                return res.status(404).send(result);
            }

            // start creating contact
            var contact = new Contact({
                firstName: firstName,
                lastName: lastName,
                phone1: phone1,
                phone2: phone2,
                email: email,
                website: website,
                facebook: facebook,
                whatsapp: whatsapp,
                twitter: twitter,
                instagram: instagram,
                tiktot: tiktot,
                businessId: business._id,
                locationId: business.locationId,
                location: business.locationId,
            });

            contact.save(contact)
            .then(newContact => {
                result.status = "success";
                result.message = "contact added to business succesfully";
                result.contact = newContact;
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred creating contact";
                return res.status(500).send(result);
            });
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding business";
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

exports.getBusinessByPlaza = (req, res) => {
    var result = {};

    var plazaId = req.query.plazaId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Business.find({plazaId: plazaId})
    .then(initBusinesses => {
        Business.find({plazaId: plazaId})
        .skip((perPage * page) - perPage)
        .limit(perPage) 
        .populate('contacts')
        .populate('category')
        .populate('location')
        .populate('plaza', {name: 1})
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
}