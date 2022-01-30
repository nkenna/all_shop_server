module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        firstname: { type: String},
        lastname: { type: String},
        phone: { type: String},
        email: { type: String},
        password: { type: String},
        avatar: { type: String },
        status: { type: Boolean, default: true }, //activate and deactivate user
        emailNotif: { type: Boolean, default: true }, // true: user recieves email notification
        verified: { type: Boolean, default: true }
      },
      {timestamps: true}
    );   
    
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({ firstname: 'text', lastname: 'text', email: 'text'});
  
    const User = mongoose.model("user", schema);
    return User;
  };