const mongoose = require ('mongoose');
const Schema = require('mongoose').Schema;

var scheduleSchema = mongoose.Schema( {
    creator: {
      type: Schema.ObjectId,
      required: true,
      ref: 'user'
    },
    section_list: {
      type: [Schema.ObjectId],
      ref: 'section',
    },
    term: {
      type: Schema.ObjectId,
      ref: 'term',
      required: true,
    },
});

module.exports = mongoose.model( 'schedule', scheduleSchema );

//user_id = req.user._id;


//when render
schedule.find({...}).populate('creator').populate('term').populate('section_list').exec(function(err, result))