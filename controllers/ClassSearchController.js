;
const ClassSearch = require( '../models/classSearch' );
console.log("loading the classSearch Controller");


exports.getAllContacts = ( req, res ) => {
    Contacts.find( {} )
      .exec()
      .then( ( contacts ) => {
        res.render( 'contacts', {contacts: contacts});
      } )
      .catch( ( error ) => {
        console.log( error.message );
        return [];
      } )
      .then( () => {
        console.log( 'Contact get' );
      } );
  };
