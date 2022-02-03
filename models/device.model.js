module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        token: { type: String, default: "" },
        deviceModel: { type: String, default: "" },
        os: { type: String, default: "" },
        userId: { type: String, default: "" },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
      },
      {timestamps: true}
    );   

    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Device = mongoose.model("device", schema);
    return Device;
  };