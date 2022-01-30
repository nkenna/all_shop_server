const dbConfig = require('../config/db.config');
const mongoose = require('mongoose');

const db = {};
db.url = dbConfig.url;
db.mongoose = mongoose;
db.users = require('./user.model')(mongoose);
db.wallets = require('./wallet.model')(mongoose);
db.walletsTrans = require('./wallettrans.model')(mongoose);
db.verifycodes = require('./verifycode.model')(mongoose);
db.resetcodes = require('./resetcode.model')(mongoose);
//db.reviews = require('./reviews.model')(mongoose);
db.plazas = require('./plaza.model')(mongoose);
db.businesses = require('./business.model')(mongoose);
db.categories = require('./category.model')(mongoose);
db.services = require('./service.model')(mongoose);
db.contacts = require('./contact.model')(mongoose);
db.products = require('./product.model')(mongoose);
db.messages = require('./message.model')(mongoose);
db.starredProducts = require('./starred.product.model')(mongoose);

//db.admins = require('./admin.model')(mongoose);
db.locations = require('./location.model')(mongoose);
//db.items = require('./item.model')(mongoose);
//db.packages = require('./package.model')(mongoose);
//db.deliveryinvoices = require('./deliveryinvoice.model')(mongoose);

//db.wallettrans = require('./wallettrans.model')(mongoose);

db.admins = require('./admin.model')(mongoose);

module.exports = db;