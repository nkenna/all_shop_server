module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name: { type: String},
        type: { type: String, required: true}, // business, product, service

      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({ name: 'text'});
  
    const Category = mongoose.model("category", schema);
    return Category;
  };