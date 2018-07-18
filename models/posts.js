'use strict';
const mongoose = require ('mongoose');

var postsSchema = mongoose.Schema( {
    pname: String,
    pprice: String,
    porigin: String,
    pdes: String
    //dphoto: File,
  } );

  module.exports = mongoose.model( 'posts', postsSchema );
