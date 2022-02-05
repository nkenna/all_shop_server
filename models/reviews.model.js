module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        content: { type: String, default: "" },
        rating: { type: Number, default: 0.0 },
        title: { type: String, default: "" },
        businessId: { type: String},
        productId: { type: String},
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product'},
        userId: { type: String},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'business'},    
        isReply: { type: Boolean, default: false },
        parentReviewId: { type: String},
        parentReview: { type: mongoose.Schema.Types.ObjectId, ref: 'review'}, 
      },
      {timestamps: true}
    );

    schema.index({ content: 'text', title: 'text' });   
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Review = mongoose.model("review", schema);
    return Review;
  };