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
        userId: { type: String},
        adminId: { type: String},
        sellOnline: {type: Boolean, default: false},
        acceptCash: {type: Boolean, default: false},
        acceptCard: {type: Boolean, default: true},
        plazaId: { type: String},
        imageData: {
          type: imageSchema,
        },
        categoryId: { type: String},
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'category'},
        plaza: { type: mongoose.Schema.Types.ObjectId, ref: 'plaza'},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'admin'},
        locationId: { type: String},
        location: { type: mongoose.Schema.Types.ObjectId, ref: 'location'},
        contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'contact'}],
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({name: 'text'});
  
    const Business = mongoose.model("business", schema);
    return Business;
  };