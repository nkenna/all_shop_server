const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Business = db.businesses;
const Category = db.categories;
const Contact = db.contacts;
const Product = db.products;
const Message = db.messages;
const StarredProduct = db.starredProducts;
const os = require('os');
var fs = require('fs');
const path = require("path");
var mime = require('mime');
var tools = require(process.cwd() + '/config/utils');
const cryptoRandomString = require('crypto-random-string');
const moment = require("moment");
var AdminFB = require("firebase-admin");


exports.createProduct = (req, res) => {
    var result = {};

    var name = req.body.name;
    var detail =  req.body.detail;
    var minPrice = req.body.minPrice;
    var maxPrice = req.body.maxPrice;
    var onlineLinks = req.body.onlineLinks;
    var businessId = req.body.businessId;
    var userId = req.body.userId;
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

        User.findOne({_id: userId})
        .then(user => {
            if(!user){
                result.status = "failed";
                result.message = "user not found";
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
                    userId: user._id,
                    categoryId: category._id,
                    locationId: business.location,
                    category: category._id,
                    business: business._id,
                    plazaId: business.plazaId,
                    plaza: business.plazaId,
                    location: business.location,
                    user: user._id,
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
            result.message = "error occurred finding user";
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

exports.editProductImage = (req, res) => {
    var result = {};

   
    let uploadPath;
    var userId = req.body.userId;
    var productId = req.body.productId;
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

        Product.findOne({_id: productId})
        .then(product => {
            if(!product){
                result.status = "failed";
                result.message = "product not found";
                return res.status(404).send(result);
            }

            uploadPath = path.join(process.cwd(), '/media/images/products/' +  avatar.name); //__dirname + '/images/avatars/' + avatar.name;
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
                    newName = product._id + '.jpg';
                }else if(avatar.mimetype == 'image/png'){
                    newName = product._id + '.png';
                }else if (avatar.mimetype == 'image/gif') {
                    newName = product._id + '.gif';
                }else {
                    newName = product._id + '.png';
                }
                
                // we need to rename here   
                var newPath = path.join(process.cwd(), '/media/images/products/' + newName);  
                fs.rename(uploadPath, newPath, function(err) {
                    if (err) {
                        result.status = "failed";
                        result.message = "avatar upload not successful: " + err;
                        return res.status(500).send(result);
                    }
                    console.log("Successfully renamed the avatar!");

                    // update product avatar field
                    var imageData = {
                        imageUrl: "media-avatar/" + newName,
                        imageName: newName,
                        imageType: avatar.mimetype,
                        
                    };

                    
                    product.images.push(imageData);
                    Product.updateOne({_id: product._id}, product)
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

exports.getAProduct = (req, res) => {

    var result = {};
    var productId = req.body.productId;

    Product.findOne({_id: productId})
    .populate('business')
    .populate('category')
    .populate('location')
    .populate('plaza', {name: 1})
    .then(product => {
        if(!product){
            result.status = "failed";
            result.message = "product not found";
            return res.status(404).send(result);
        }

        result.status = "success";
        result.message = "product found";
        result.product = product;
        return res.status(200).send(result);
        
    })
}

exports.getProductsByBusiness = (req, res) => {
    var result = {};

    var businessId = req.query.businessId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Product.find({businessId: businessId})
    .then(initProducts => {
        Product.find({businessId: businessId})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate('category')
        .populate('location')
        .populate('business', {name: 1})
        .populate('plaza', {name: 1})
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
}

exports.getProductsByPlaza = (req, res) => {
    var result = {};

    var plazaId = req.query.plazaId;
    var page = req.query.page;
    var perPage = 50;

    if(!page){
        page = 1;
    }

    Product.find({plazaId: plazaId})
    .then(initProducts => {
        Product.find({plazaId: plazaId})
        .skip((perPage * page) - perPage)
        .limit(perPage) 
        .populate('business')
        .populate('category')
        .populate('location')
        .populate('plaza', {name: 1})
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
            result.message = "error occurred finding products by plaza";
            return res.status(500).send(result);
        });        
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred getting total products by plaza";
        return res.status(500).send(result);
    });
}

exports.makeProductOffer = (req, res) => {
    var result = {};

    var productId = req.body.productId;
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
                title: "Product offer Message",
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

exports.starUnstarProduct = (req, res) => {
    var result = {};

    var starred = req.body.starred;
    var productId = req.body.productId;
    var userId = req.body.userId;

    Product.findOne({_id: productId})
    .then(product => {
        if(!product){
            result.status = "failed";
            result.message = "product not found";
            return res.status(404).send(result);
        }

        if(starred){
            // create StarredProduct
            var sProduct = new StarredProduct({
                productId: product._id,
                userId: userId,
                product: product._id,
                user: userId,
                starred: starred
            });

            sProduct.save(sProduct)
            .then(starredP => {
                // update product starred status
                product.starred = true;
                Product.updateOne({_id: product._id}, product)
                .then(data => console.log("product starred status updated to true"))
                .catch(err => console.log("error occured updating product starred status updated to true"));

                result.status = "success";
                result.message = "product starred successful";
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred saving starred product";
                return res.status(500).send(result);
            });
        }
        else{
            // find starred product object
            StarredProduct.findOne({productId: productId})
            .then(starredProduct => {
                if(!starredProduct){
                    result.status = "failed";
                    result.message = "starred product not found";
                    return res.status(404).send(result);
                }

                // delete from db
                StarredProduct.deleteOne({_id: starredProduct._id})
                .then(data => {
                    // update product starred status
                    product.starred = false;
                    Product.updateOne({_id: product._id}, product)
                    .then(data => console.log("product starred status updated to false"))
                    .catch(err => console.log("error occured updating product starred status updated to false"));

                    result.status = "success";
                    result.message = "product unstarred successful";
                    return res.status(200).send(result);
                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred deleting starred product";
                    return res.status(500).send(result);
                });
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding starred product";
                return res.status(500).send(result);
            });
        }

        
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding product";
        return res.status(500).send(result);
    });
}

exports.starredProductsByUser = (req, res) => {
    var result = {};

    var userId = req.query.userId;

    StarredProduct.find({userId: userId})
    .populate({ 
        path: 'product',
        populate: {
          path: 'business',
          model: 'business',
        },
        
     })
     .populate({ 
        path: 'user',
        populate: {
          path: 'user',
          model: 'user'
        } 
     })
    .then(products => {
        result.status = "success";
        result.message = "starred products found";
        result.products = products;
        return res.status(200).send(result);
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding starred products";
        return res.status(500).send(result);
    });
}



