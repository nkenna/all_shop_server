const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const VerifyCode = db.verifycodes;
const ResetCode = db.resetcodes;
const Device = db.devices;
const Business = db.businesses;
const Product = db.products;
const Review = db.reviews;

var tools = require(process.cwd() + '/config/utils');
const cryptoRandomString = require('crypto-random-string');
const moment = require("moment");


exports.createReview = (req, res) => {
    var result = {}; 

    var content = req.body.content;
    var rating = req.body.rating;
    var title = req.body.title;
    var productId = req.body.productId;
    var businessId = req.body.businessId;
    var userId = req.body.userId;
    var type = req.body.type;

    if(!type){
        result.status = "failed";
        result.message = "review type is required";
        return res.status(400).send(result);
    }

    if(type == 'product' && !productId){
        result.status = "failed";
        result.message = "product data is required for this type of review";
        return res.status(400).send(result);
    }

    if(type == 'business' && !businessId){
        result.status = "failed";
        result.message = "store data is required for this type of review";
        return res.status(400).send(result);
    }


    User.findOne({_id: userId})
    .then(user => {
        if(!user){
            result.status = "failed";
            result.message = "user does not exist";
            return res.status(404).send(result);
        }

        if(type == 'business'){
            Business.findOne({_id: businessId})
            .then(business => {
                if(!business){
                    result.status = "failed";
                    result.message = "store does not exist";
                    return res.status(404).send(result);
                }

                // create a review
                var reviewNew = new Review({
                    content: content,
                    rating: rating,
                    title: title,
                    businessId: business._id,
                    userId: user._id,
                    user: user._id,
                    business: business._id
                });

                reviewNew.save(reviewNew)
                .then(review => {
                    //update business data
                    business.ratingCount = business.ratingCount + 1;
                    business.sumRating = business.sumRating + rating;
                    business.avgRating = business.sumRating/business.ratingCount;

                    Device.findOne({userId: author._id})
                    .then(device => {
                        if(device){
                            tools.pushMessageToDevice(
                                device.token,
                                "New Store Review",
                                "Someone just reviewed and rated your Store. Open app to view this.",
                                ""
                            );
                        }
                    })
                    .catch(err => console.log("error finding device"));

                    result.status = "success";
                    result.message = "review added successfully";
                    result.review = review;
                    return res.status(200).send(result);

                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred saving review";
                    return res.status(500).send(result);
                });
        
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding Store";
                return res.status(500).send(result);
            });
        }

        if(type == 'product'){
            Product.findOne({_id: productId})
            .then(product => {
                if(!product){
                    result.status = "failed";
                    result.message = "product does not exist";
                    return res.status(404).send(result);
                }

                // create a review
                var reviewNew = new Review({
                    content: content,
                    rating: rating,
                    title: title,
                    productId: product._id,
                    userId: user._id,
                    user: user._id,
                    product: product._id
                });

                reviewNew.save(reviewNew)
                .then(review => {
                    //update business data
                    product.ratingCount = product.ratingCount + 1;
                    product.sumRating = product.sumRating + rating;
                    product.avgRating = product.sumRating/product.ratingCount;

                    Product.updateOne({_id: product._id}, product)
                    .then(data => console.log('product updated'))
                    .catch(err => console.log("error updating product"));

                    Device.findOne({userId: author._id})
                    .then(device => {
                        if(device){
                            tools.pushMessageToDevice(
                                device.token,
                                "New Store Review",
                                "Someone just reviewed and rated your Store. Open app to view this.",
                                ""
                            );
                        }
                    })
                    .catch(err => console.log("error finding device"));

                    result.status = "success";
                    result.message = "review added successfully";
                    result.review = review;
                    return res.status(200).send(result);

                })
                .catch(err => {
                    console.log(err);
                    result.status = "failed";
                    result.message = "error occurred saving review";
                    return res.status(500).send(result);
                });
        
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred finding Store";
                return res.status(500).send(result);
            });
        }

       
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding user";
        return res.status(500).send(result);
    });
}

exports.reviewsByProduct = (req, res) => {
    var result = {};

    var productId = req.query.productId;
    var page = req.query.page;  
    var perPage = 50;
    
    if(!page){
        page = 1;
    }
    console.log(page);
  

    Review.find({productId: productId})
    .then(intReviews => {
        Review.find({productId: productId})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate("product")
        .populate("business")
        .populate("parentReview")
        .populate("user", {firstname: 1, lastname: 1, email: 1, avatar: 1})
        .sort('-createdAt')
        .then(reviews => {
            result.status = "success";
            result.reviews = reviews;
            result.total = intReviews.length;
            result.page = page;
            result.perPage = perPage;
            result.message = "reviews found: " + reviews.length;
            return res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding reviews";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding reviews";
        return res.status(500).send(result);
    });
}

exports.reviewsByBusiness = (req, res) => {
    var result = {};

    var businessId = req.query.businessId;
    var page = req.query.page;  
    var perPage = 50;
    
    if(!page){
        page = 1;
    }
    console.log(page);
  

    Review.find({businessId: businessId})
    .then(intReviews => {
        Review.find({businessId: businessId})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate("product")
        .populate("business")
        .populate("parentReview")
        .populate("user", {firstname: 1, lastname: 1, email: 1, avatar: 1})
        .sort('-createdAt')
        .then(reviews => {
            result.status = "success";
            result.reviews = reviews;
            result.total = intReviews.length;
            result.page = page;
            result.perPage = perPage;
            result.message = "reviews found: " + reviews.length;
            return res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            result.status = "failed";
            result.message = "error occurred finding reviews";
            return res.status(500).send(result);
        });
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding reviews";
        return res.status(500).send(result);
    });
}

exports.deleteReview = (req, res) => {
    var result = {};

    var reviewId = req.body.reviewId;
    var userId = req.body.userId;

    Review.findOne({_id: reviewId})
    .then(review => {
        if(!review){
            result.status = "failed";
            result.message = "review not found";
            return res.status(404).send(result);
        }

        // make sure that this user is allowed to delete this review
        User.findOne({_id: userId})
        .then(user => {
            if(!user){
                result.status = "failed";
                result.message = "user not found";
                return res.status(404).send(result);
            }

            if(user._id != review.userId){
                result.status = "failed";
                result.message = "you are not allowed to delete this review";
                return res.status(403).send(result);
            }

            // delete review
            Review.deleteOne({_id: review._id})
            .then(dd => {
                // if review type is product, deduct review from body
                if(review.type == 'product'){
                    // find product
                    Product.findOne({_id: productId})
                    .then(product => {
                        if(!product){
                            result.status = "failed";
                            result.message = "product not found";
                            return res.status(404).send(result);
                        }

                        product.ratingCount = product.ratingCount - 1;
                        product.sumRating = product.sumRating - rating;
                        product.avgRating = product.sumRating/product.ratingCount;
                        
                        Product.updateOne({_id: product._id}, product)
                        .then(data => console.log('product updated'))
                        .catch(err => console.log("error updating product"));
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred finding product";
                        return res.status(500).send(result);
                    });
                }

                if(review.type == 'business'){
                    // find business
                    Business.findOne({_id: bsuinessId})
                    .then(business => {
                        if(!business){
                            result.status = "failed";
                            result.message = "store not found";
                            return res.status(404).send(result);
                        }

                        business.ratingCount = business.ratingCount - 1;
                        business.sumRating = business.sumRating - rating;
                        business.avgRating = business.sumRating/business.ratingCount;
                        
                        Business.updateOne({_id: business._id}, business)
                        .then(data => console.log('product updated'))
                        .catch(err => console.log("error updating product"));
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred finding product";
                        return res.status(500).send(result);
                    });
                }

                result.status = "sucess";
                result.message = "review deleted successfully";
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred deleting review";
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
        result.message = "error occurred finding review";
        return res.status(500).send(result);
    });
}

exports.editReview = (req, res) => {
    var result = {};

    var reviewId = req.body.reviewId;
    var userId = req.body.userId;
    var title = req.body.title;
    var content = req.body.content;
    var rating = req.body.rating;

    Review.findOne({_id: reviewId})
    .then(review => {
        if(!review){
            result.status = "failed";
            result.message = "review not found";
            return res.status(404).send(result);
        }

        // make sure that this user is allowed to delete this review
        User.findOne({_id: userId})
        .then(user => {
            if(!user){
                result.status = "failed";
                result.message = "user not found";
                return res.status(404).send(result);
            }

            if(user._id != review.userId){
                result.status = "failed";
                result.message = "you are not allowed to delete this review";
                return res.status(403).send(result);
            }

            // update review
            review.title = title;
            review.content = content;
            review.rating = rating;

            Review.updateOne({_id: review._id}, review)
            .then(dd => {
                // if review type is product, deduct review from body
                if(review.type == 'product'){
                    // find product
                    Product.findOne({_id: productId})
                    .then(product => {
                        if(!product){
                            result.status = "failed";
                            result.message = "product not found";
                            return res.status(404).send(result);
                        }

                        var oldSumRating = product.sumRating;
                        product.sumRating = (product.sumRating + rating) - oldSumRating;
                        product.avgRating = product.sumRating/product.ratingCount;
                        
                        Product.updateOne({_id: product._id}, product)
                        .then(data => console.log('product updated'))
                        .catch(err => console.log("error updating product"));
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred finding product";
                        return res.status(500).send(result);
                    });
                }

                if(review.type == 'business'){
                    // find business
                    Business.findOne({_id: bsuinessId})
                    .then(business => {
                        if(!business){
                            result.status = "failed";
                            result.message = "store not found";
                            return res.status(404).send(result);
                        }

                        var oldSumRating = business.sumRating;
                        business.sumRating = (business.sumRating + rating) - oldSumRating;
                        business.avgRating = business.sumRating/business.ratingCount;
                        
                        Business.updateOne({_id: business._id}, business)
                        .then(data => console.log('product updated'))
                        .catch(err => console.log("error updating product"));
                    })
                    .catch(err => {
                        console.log(err);
                        result.status = "failed";
                        result.message = "error occurred finding product";
                        return res.status(500).send(result);
                    });
                }

                result.status = "sucess";
                result.message = "review updated successfully";
                return res.status(200).send(result);
            })
            .catch(err => {
                console.log(err);
                result.status = "failed";
                result.message = "error occurred updating review";
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
        result.message = "error occurred finding review";
        return res.status(500).send(result);
    });



}
