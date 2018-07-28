const mongoose = require ('mongoose');

var departmentSchema = mongoose.Schema( {
    name: {
      type: String,
      //required: true
    },
    id: {
      type: String
    }
  } );

  module.exports = mongoose.model( 'department', departmentSchema );
