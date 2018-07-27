const mongoose = require ('mongoose');
const Schema = mongoose.Schema;

var groupSchema = mongoose.Schema( {
    name: {
      type: String,
      required: true
    },
    users: {
      type: [Schema.ObjectId],
      ref: 'user',
      required: true,
    },
    createdAt: {
      type: Date,
      required: true
    },
    locked: {
      type: Boolean,
      required: true,
    }
});

module.exports = mongoose.model( 'group', groupSchema );
