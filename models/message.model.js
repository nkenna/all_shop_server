module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        title: { type: String},
        content: { type: String},
        senderId: { type: String},
        recieverId: { type: String},
        read: {type: Boolean, default: false},
        type: { type: String}, //offer, product, business, service, general
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product'},
        business: { type: mongoose.Schema.Types.ObjectId, ref: 'business'},
        plaza: { type: mongoose.Schema.Types.ObjectId, ref: 'plaza'},
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        reciever: { type: mongoose.Schema.Types.ObjectId, ref: 'user'}
      },
      {timestamps: true}
    );       
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({title: 'text', content: 'text'});
  
    const Message = mongoose.model("message", schema);
    return Message;
  };
 