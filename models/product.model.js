module.exports = mongoose => {
  const imageSchema = new mongoose.Schema({
    imageUrl: {
      type: String
    },
    imageName: {
      type: String
    },
    imageType: {
      type: String
    },
    position: {
      type: String
    }
  });

    var schema = mongoose.Schema(
      {
        name: { type: String},
        detail: { type: String},
        ref: { type: String, required: true},
        starred: { type: String, required: false},
        minPrice: {type: Number, default: 0.0},
        maxPrice: {type: Number, default: 0.0},
        onlineLinks: [{type: String}],
        ratingCount: { type: Number, default: 0 },
        sumRating: { type: Number, default: 0.0 },
        avgRating: { type: Number, default: 0.0 },
        businessId: { type: String},
        adminId: { type: String},
        userId: { type: String},
        plazaId: { type: String},
        categoryId: { type: String},
        locationId: { type: String},
        images: [{
          type: imageSchema,
        }],
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'category'},
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'business'},
        plaza: { type: mongoose.Schema.Types.ObjectId, ref: 'plaza'},
        location: { type: mongoose.Schema.Types.ObjectId, ref: 'location'},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'admin'},
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({name: 'text', detail: 'text'});
  
    const Product = mongoose.model("product", schema);
    return Product;
  };