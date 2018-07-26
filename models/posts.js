;
const mongoose = require ('mongoose');

var postsSchema = mongoose.Schema( {
    pname: String,
    pprice: String,
    porigin: String,
    pdes: String,
    pid: String,
    //dphoto: File,
  } );

  module.exports = mongoose.model( 'posts', postsSchema );

  