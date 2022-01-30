module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        walletRef: { type: String, default: "" },
        amount: { type: Number, default: 0.0 },
        commission: { type: Number, default: 0.0 },
        status: { type: String, default: "" }, //success, pending, failed, cancelled, successful
        channel: { type: String, default: "" }, // card, transfer, ussd,
        type: { type: String, default: "" }, // FUND, PAYOUT, BUY BOOK, SALES
        payerEmail: { type: String, default: "" },   
        transId: { type: String, default: "" },  
        wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'wallet'},    
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
      },
      {timestamps: true}
    );   
    
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    schema.index({ walletRef: 'text', payerEmail: 'text', transId: 'text'});
  
    const WalletTrans = mongoose.model("wallettrans", schema);
    return WalletTrans;
  };