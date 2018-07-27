const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

var conversationSessionSchema = mongoose.Schema( {
    session: {
      type: String,
      required: true
    },
    user_id: {
      type: Schema.ObjectId,
      ref: 'user'
    }
});
  
module.exports = mongoose.model( 'conversationSession', conversationSessionSchema );
  