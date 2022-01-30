module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name: { type: String},
        detail: { type: String},
        businessId: { type: String},
        userId: { type: String},
        categoryId: { type: String},
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'category'},
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'business'},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({name: 'text'});
  
    const Service = mongoose.model("service", schema);
    return Service;
  };