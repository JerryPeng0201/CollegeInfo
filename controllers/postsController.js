;
const Posts = require( '../models/posts' );
console.log("Item-Post Controller Normal")

exports.myPosts = (req, res) => {
  Posts.find({pid: req.user._id}, function(err, post_list){
    if(err){
      console.log(err);
    } else {
      if(post_list.length == 0){
        res.render('myPosts')
      } else if(post_list){
        res.render('myPosts', {posts: post_list});
      } 
    }
  })
}

exports.deletePost = function(req, res){
  Posts.findByIdAndRemove(req.params.post_id, function(err, doc){
    if(err){
      res.status(err.status || 500);
      res.json(err);
    } else {
      res.json({})
    }
  })
}

exports.getAllPosts = ( req, res ) => {

    Posts.find( {} )
      .exec()
      .then( ( posts ) => {
        res.render( 'posts', { posts: posts } );
      } )
      .catch( ( error ) => {
        console.log( error.message );
        return [];
      } )
      .then( () => {
        console.log( 'User post get' );
      } );
  };

exports.filterPosts = function(req, res, next){
  const porigin = req.body.porigin;

  Posts.find({porigin: porigin}, function(err, result){
    if(err){
      next(err);
    } else {
      res.render('posts', {posts: result, postType: porigin});
    }
  })
}

exports.savePosts = ( req, res ) => {
  console.log("in update posts!")
  console.dir(req)
  let newPosts = new Posts( {
    pname: req.body.pname,
    pdes: req.body.pdes,
    porigin: req.body.porigin,
    pprice: req.body.pprice,
    pcon: req.body.pcon,
    pid: req.user._id,
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
  Posts.findOne(objId) //{"_id": objId})
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
