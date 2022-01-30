module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        firstName: { type: String},
        lastName: { type: String},
        phone1: { type: String},
        phone2: { type: String},
        email: {type: String, default: ""},
        website: {type: Boolean, default: false},
        facebook: {type: Boolean, default: true},
        whatsapp: { type: String},
        twitter: { type: String},
        instagram: { type: String},
        tiktot: { type: String},
        businessId: { type: String},
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'business'},
        locationId: { type: String},
        location: { type: mongoose.Schema.Types.ObjectId, ref: 'location'},
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({firstName: 'text', lastName: 'text'});
  
    const Contact = mongoose.model("contact", schema);
    return Contact;
  };