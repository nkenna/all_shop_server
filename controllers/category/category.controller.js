const db = require(process.cwd() + "/models");
const User = db.users;
const Wallet = db.wallets;
const Plaza = db.plazas;
const Business = db.businesses;
const Category = db.categories;
const cryptoRandomString = require('crypto-random-string');

exports.addCategory = (req, res) => {
    var result = {};

    var name = req.body.name;
    var type = req.body.type;

    if(!name || !type){
        result.status = "failed";
        result.message = "category name and type are required";
        return res.status(400).send(result); 
    }

    if(type != "business" && type != "product" && type != "service"){
        result.status = "failed";
        result.message = "category type must be business, product or service";
        return res.status(400).send(result); 
    }

    var cate = new Category({
        name: name,
        type: type
    });

    cate.save(cate)
    .then(category => {
        result.status = "success";
        result.message = "new category created successfully";
        result.category = category;
        return res.status(200).send(result);
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred category";
        return res.status(500).send(result);
    });
}

exports.allCategory = (req, res) => {
    var result = {};

    Category.find()
    .then(categories => {
        result.status = "success";
        result.categories = categories;
        result.message = "categories found";
        return res.status(200).send(result);
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding categories";
        return res.status(500).send(result);
    });
}

exports.categoryByType = (req, res) => {
    var result = {};
    var type = req.query.type;

    Category.find({type: type})
    .then(categories => {
        result.status = "success";
        result.categories = categories;
        result.message = "categories found";
        return res.status(200).send(result);
    })
    .catch(err => {
        console.log(err);
        result.status = "failed";
        result.message = "error occurred finding categories";
        return res.status(500).send(result);
    });
}