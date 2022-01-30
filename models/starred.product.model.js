module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        productId: { type: String},
        userId: { type: String},
        starred: { type: String, required: true},
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product'},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const StarredProduct = mongoose.model("starredproduct", schema);
    return StarredProduct;
  };