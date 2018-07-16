'use strict';
const Posts = require( '../models/contacts' );
console.log("loading the contacts Controller")


exports.getAllContacts = ( req, res ) => {

    Contacts.find( {} )
      .exec()
      .then( ( contacts ) => {
        res.render( 'contacts', {
          contacts: contacts
        } );
      } )
      .catch( ( error ) => {
        console.log( error.message );
        return [];
      } )
      .then( () => {
        console.log( 'Contact get' );
      } );
  };

exports.saveContacts = ( req, res ) => {
  console.log("in update !")
  console.dir(req)
  let newContacts = new Contacts( {
    cname: req.body.cname,
    cemail: req.body.cemail,
    cmobile: req.body.cmobile,
    csubject: req.body.csubject,
    cmessage: req.body.cmessage,
  } )

  console.log("contact = "+newContacts)

  newContacts.save()
    .then( () => {
      res.redirect( '/' );
    } )
    .catch( error => {
      res.send( error );
    } );
};