const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Business = db.businesses;
const Category = db.categories;
const Contact = db.contacts;
const Product = db.products;
const Message = db.messages;
const os = require('os');
var fs = require('fs');
const path = require("path");

var mime = require('mime');
var tools = require(process.cwd() + '/config/utils');
const cryptoRandomString = require('crypto-random-string');
const moment = require("moment");

exports.readMessage = (req, res) => {
    var result = {};

    var msgId = req.body.msgId;
    var userId = req.body.userId;

    Message.findOne({_id: msgId})
    .then(message => {
        if(!message){
            result.status = "failed";
            result.message = "message not found";
            return res.status(404).send(result);
        }

        if(message.recieverId != userId){
            result.status = "failed";
            result.message = "you are not allowed to read this message";
            return res.status(403).send(result);
        }

        message.read = true;
        Message.updateOne({_id: message._id}, message)
        .then(updated => {
            result.status = "success";
            result.message = "message read successfully";
            return res.status(200).send(result); 
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred reading message";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding message";
        return res.status(500).send(result);
    });
}

exports.deleteMessage = (req, res) => {
    var result = {};

    var msgId = req.body.msgId;
    var userId = req.body.userId;

    Message.findOne({_id: msgId})
    .then(message => {
        if(!message){
            result.status = "failed";
            result.message = "message not found";
            return res.status(404).send(result);
        }

        /*if(message.recieverId != userId){
            result.status = "failed";
            result.message = "you are not allowed to delete this message";
            return res.status(403).send(result);
        }

        if(message.senderId != userId){
            result.status = "failed";
            result.message = "you are not allowed to delete this message";
            return res.status(403).send(result);
        } */

        Message.deleteOne({_id: message._id})
        .then(deleted => {
            result.status = "success";
            result.message = "message deleted successfully";
            return res.status(200).send(result); 
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred deleting message";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding message";
        return res.status(500).send(result);
    });
}

exports.createMessage = (req, res) => {
    var result = {};

    var productId = req.body.productId;
    var businessId = req.body.businessId;
    var recieverId = req.body.recieverId;
    var userId = req.body.userId;
    var offerMsg = req.body.offerMsg;

    // find user making the offer first first
    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user account not found";
            return res.status(404).send(result);
        }

        // find that particular product
        Product.findOne({_id: productId})
        .then(product => {
            if(!product){
                result.status = "failed";
                result.message = "product not found";
                return res.status(404).send(result);
            }

            // create an offer message
            var msg = new Message({
                content: offerMsg,
                senderId: user._id,
                recieverId: product.userId,
                type: "offer",
                product: product._id,
                business: product.businessId,
                plaza: product.plazaId,
                sender: user._id,
                reciever: product.userId
            });

            msg.save(msg)
            .then(newMsg => {
                // send email to reciever
                // send push notification to reciever

                result.status = "success";
                result.message = "product offer message sent successfully";
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred senting product offer message";
                return res.status(500).send(result);
            });
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding product";
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

