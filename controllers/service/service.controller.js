const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Business = db.businesses;
const Category = db.categories;
const Service = db.services;
const os = require('os');
var fs = require('fs');
const path = require("path");

var mime = require('mime');
var tools = require(process.cwd() + '/config/utils');
const cryptoRandomString = require('crypto-random-string');
const moment = require("moment");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const ExcelJS = require('exceljs');
var AdminFB = require("firebase-admin");
const twilio = require('twilio');


exports.addService = (req, res) => {
    var result = {};
        
    var name = req.body.name;
    var detail = req.body.detail;
    var businessId = req.body.businessId;
    var userId = req.body.userId;
    var categoryId = req.body.categoryId;

    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
            return res.status(404).send(result);
        }

        // find Business
        Business.findOne({_id: businessId})
        .then(business => {
            if(!business){
                result.status = "failed";
                result.message = "business data not found";
                return res.status(404).send(result);
            }

            // find category
            Category.findOne({_id: categoryId})
            .then(category => {
                if(!category){
                    result.status = "failed";
                    result.message = "category data not found";
                    return res.status(404).send(result);
                }

                // create service
                var service = new Service({
                    name: name,
                    detail: detail,
                    businessId: business._id,
                    userId: user._id,
                    categoryId: category._id,
                    category: category._id,
                    business: business._id,
                    user: user._id,
                });

                service.save(service)
                .then(newService => {
                    result.status = "success";
                    result.message = "new service created";
                    result.service = newService;
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred creating service";
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

exports.editServiceCategory = (req, res) => {
    var result = {};
   
    var categoryId = req.body.categoryId;
    var serviceId = req.body.businessId;
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
                Service.findOne({_id: serviceId})
                .then(service => {
                    if(!user){
                        result.status = "failed";
                        result.message = "service data not found";
                        return res.status(404).send(result);
                    }

                    if(service.userId != user._id){
                        result.status = "failed";
                        result.message = "you are not allowed to edit this service";
                        return res.status(403).send(result);
                    }

                    // update business
                    service.categoryId = category._id;
                    service.category = category._id;

                    Service.updateOne({_id: service._id}, service)
                    .then(updated => {
                        result.status = "success";
                        result.message = "service updated successfully";
                        return res.status(200).send(result); 
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred updating service";
                        return res.status(500).send(result);
                    });
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred finding service";
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