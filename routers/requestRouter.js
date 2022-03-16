const express= require('express');
const Router = express.Router();
const controller= require('../controllers/controller');
const functions= require('../controllers/functions');

Router.get('/',controller.serverTestFunction)
Router.post('/whatsapp',controller.callbackHandler);
Router.get('/mpesaPush',functions.mpesaPush);

module.exports=Router;