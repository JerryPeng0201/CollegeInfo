'use strict';
const Posts = require( '../models/posts' );
console.log("loading the posts Controller")


exports.getAllPosts = ( req, res ) => {

    Posts.find( {} )
      .exec()
      .then( ( posts ) => {
        res.render( 'posts', {
          posts: posts
        } );
      } )
      .catch( ( error ) => {
        console.log( error.message );
        return [];
      } )
      .then( () => {
        console.log( 'User post get' );
      } );
  };

exports.savePosts = ( req, res ) => {
  console.log("in update posts!")
  console.dir(req)
  let newPosts = new Posts( {
    pname: req.body.pname,
    pdes: req.body.pdes,
    porigin: req.body.porigin,
    pprice: req.body.pprice
  } )

  console.log("posts = "+newPosts)

  newPosts.save()
    .then( () => {
      res.redirect( '/posts' );
    } )
    .catch( error => {
      res.send( error );
    } );
};

// exports.deleteDrinks = (req, res) => {
//   console.log("in deleteDrinks")
//   let drinksName = req.body.deleteName
//   if (typeof(drinksName)=='string') {
//       Skill.deleteOne({name:drinksName})
//            .exec()
//            .then(()=>{res.redirect('/drinks')})
//            .catch((error)=>{res.send(error)})
//   } else if (typeof(drinksName)=='object'){
//       Skill.deleteMany({name:{$in:drinksName}})
//            .exec()
//            .then(()=>{res.redirect('/drinks')})
//            .catch((error)=>{res.send(error)})
//   } else if (typeof(drinksName)=='undefined'){
//       console.log("This is if they didn't select")
//       res.redirect('/drinks')
//   } else {
//     console.log("This shouldn't happen!")
//     res.send(`unknown drinkName: ${drinksName}`)
//   }

// };
exports.getPdes = ( req, res ) => {
  const objId = new mongo.ObjectId(req.params.id)
  Posts.findOne({"_id": objID}) 
    .exec()
    .then( ( posts ) => {
      res.render( 'posts', {
        posts: posts
      } );
    } )
    .catch( ( error ) => {
      console.log( error.message );
      return [];
    } )
    .then( () => {
      console.log( 'getPdes complete' );
    } );
};

exports.attachPdes = ( req, res, next ) => {
  console.log('in attachPdes')
  const objId = new mongo.ObjectId(req.params.id)
  Drinks.findOne(objId) //{"_id": objId})
    .exec()
    .then( ( posts ) => {
      res.locals.posts = posts
      next()
    } )
    .catch( ( error ) => {
      console.log( error.message );
      return [];
    } )
    .then( () => {
      console.log( 'attachPdes complete' );
    } );
};
