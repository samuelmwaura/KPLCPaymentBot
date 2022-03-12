const express= require('express');
const Router = express.Router();
const controller= require('../controllers/controller');

Router.get('/',controller.serverTestFunction)
Router.post('/whatsapp',controller.callbackHandler);

module.exports=Router;