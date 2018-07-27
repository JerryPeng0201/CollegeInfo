'use strict';
const mongoose = require( 'mongoose' );
console.log("Pending")

//var userSchema = mongoose.Schema( {any:{}})

var userSchema = mongoose.Schema( {
  googleid: String,
  googletoken: String,
  googlename:String,
  googleemail:String,
  description: String,
  keycode: String,
} );

module.exports = mongoose.model( 'user', userSchema );

/*
newUser.google.id    = profile.id;
newUser.google.token = token;
newUser.google.name  = profile.displayName;
newUser.google.email = profile.emails[0].value; // pull the first email
*/
