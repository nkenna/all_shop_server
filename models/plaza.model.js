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
        name: { type: String, default: ""},
        detail: { type: String, default: ""},
        userId: { type: String, default: ""},
        adminId:  { type: String, default: ""},
        status: {type: Boolean, default: false},
        adminControl: {type: Boolean, default: true},
        images: [{
          type: imageSchema,
        }],
        locationId: { type: String, default: ""},
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

    schema.index({ name: 'text'});
  
    const Plaza = mongoose.model("plaza", schema);
    return Plaza;
  };