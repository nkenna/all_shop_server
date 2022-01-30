module.exports = mongoose => {
  const {Point} = require('mongoose-geojson-schema');

  const pointSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
    }
  });

    var schema = mongoose.Schema(
      {
        country: { type: String, default: ""},
        state: { type: String, default: ""},
        city: { type: String, default: ""},
        address: { type: String, default: ""},
        landmark: { type: String, default: ""},
        type: { type: String, default: ""}, // user, plaza, business
        loc:  {
          type: pointSchema,
          required: true
        },
        userId: { type: String, default: ""},
        plazaId: { type: String, default: ""},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        plaza: { type: mongoose.Schema.Types.ObjectId, ref: 'plaza'},
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
    schema.index({ loc: '2dsphere' });

    schema.index({ country: 'text', state: 'text', city: 'text', address: 'text'});
    //db.yourcollection.createIndex({geometry: "2dsphere"});
    
    const Location = mongoose.model("location", schema);
    return Location;
};