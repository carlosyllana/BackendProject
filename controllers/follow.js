'use strict'

// var path = require('path');
// var fs= require('fs');
var mongoosePaginate = require('mongoose-pagination');
var mongoose = require('mongoose');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req,res){
  var params = req.body;

  var follow= new Follow();
  follow.user = req.user.sub;
  follow.followed = params.followed;

  follow.save((err, followStored)=>{
    if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});

    if(!followStored){
      return res.status(404).send({message: 'El seguimiento no se ha guardado'});
    }
    //Si no hay errores se envia el seguimiento
    return res.status(200).send({follow: followStored});
  });
}

function deleteFollow(req,res){
      var userId = req.user.sub;
      var followId = req.params.id;

      Follow.find({'user': userId, 'followed':followId}).remove(err =>{
        if(err) return res.status(500).send({message: 'Error al dejar de seguir'});

        return res.status(200).send({message: 'El follow se ha eliminado!!'});
      });

}


function getFollowingUsers(req,res){
  var userId = req.user.sub;

  if(req.params.id && req.params.page){
    userId = req.params.id
  }

  var page = 1;

  if(req.params.page){
    page = req.params.page;
  }else{
    page = req.params.id;
  }

  var itemsPerPage = 4;

  Follow.find({user:userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err,follows, total) =>{
      if(err) return res.status(500).send({message: 'Error en el servidor'});

      if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});

      followUserIds(req.user.sub).then((value)=>{
          return  res.status(200).send({
              total: total,
              pages: Math.ceil(total/itemsPerPage),
              follows,
              users_following: value.following,
              users_follow_me: value.followed
           });
       });
  });

}



function getFollowedUsers(req,res){
  var userId = req.user.sub;

  if(req.params.id && req.params.page){
    userId = req.params.id
  }

  var page = 1;

  if(req.params.page){
    page = req.params.page;
  }else{
    page = req.params.id;
  }
  console.log(userId);

  var itemsPerPage = 4;


  Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err,follows, total) =>{
    console.log(err);
      if(err) return res.status(500).send({message: 'Error en el servidor'});

      if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

      followUserIds(req.user.sub).then((value)=>{
          return  res.status(200).send({
              total: total,
              pages: Math.ceil(total/itemsPerPage),
              follows,
              users_following: value.following,
              users_follow_me: value.followed
           });
       });
  });

}

//Devolver listado de usuarios
function getMyFollows(req,res){
  var userId = req.user.sub;
  var followed = req.params.followed;

  var find = Follow.find({user:userId});
  if(req.params.followed){
      find =Follow.find({followed:userId});
  }

  find.populate('user followed').exec((err, follows)=>{
    if(err) return res.status(500).send({message: 'Error en el servidor'});

    if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

    return  res.status(200).send({follows});
  });
}



async function followUserIds(user_id){
    try {
        var following = await Follow.find({'user':user_id}).select({'_id':0,'__v':0,'user':0}).exec()
        .then((following) => {
            return following;
        })
        .catch((err)=>{
            return handleError(err);
        });
        var followed = await Follow.find({'followed':user_id}).select({'_id':0,'__v':0,'followed':0}).exec()
        .then((followed) => {
            return followed;
        })
        .catch((err)=>{
            return handleError(err);
        });    //Procesr following ids
        var following_clean = [];
        following.forEach((follow)=>{
            following_clean.push(follow.followed);
        });


        //Procesar followed ids
        var followed_clean = [];
        followed.forEach((follow)=>{
            followed_clean.push(follow.user);
        });

        return{
            following: following_clean,
            followed: followed_clean
        }
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    }
}







module.exports={
  saveFollow,
  deleteFollow,
  getFollowingUsers,
  getFollowedUsers,
  getMyFollows,
  followUserIds
}
