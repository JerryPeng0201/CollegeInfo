;
const mongoose = require ('mongoose');

var contactsSchema = mongoose.Schema( {
    cname: String,
    cemail: String,
    cmobile: String,
    csubject: String,
    cmessage: String,
    
  } );
  
  module.exports = mongoose.model( 'contacts', contactsSchema );
  