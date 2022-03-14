const sendingFile=require('../sendingFile');
const request= require('request');
const {customer,token,payment,meter,stage,session}= require('../models/KplcDatabaseModel');
const unirest=require('unirest');


//RESPONSE BODY 
let messageObject= {
    "messages": [
       {
       "channel": "whatsapp",
       "to": "254703674306",      
       }
    ]        
}


//ERROR lOG FUNCTION
const errorFunction=(err)=>{
    console.log(err);
}


//REPLY FUNCTION
const replyFunction=(obj)=>{   
    sendingFile.options.body=JSON.stringify(obj)
    request.post(sendingFile.options,sendingFile.onResponseReceipt);
    console.log( obj.messages[0].content);
}


//SET TIMEOUT FUNCTION AND CALL - Customer stopped before the conversation is over
const sessionTimeout=(obj,customerPhone)=>{
  endSession(customerPhone);
  stage.update({stage:'1'},{where:{customerPhone}}).then(()=>{
    obj.messages[0].content='You stayed for too long without replying,Please begin another session:\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.';
    replyFunction(obj);
  }).catch(err=>console.log(err));
  }


//STARTSTAGE FUNCTION
const startStage=(messageObj,phone)=>{
    messageObj.messages[0].content=`Welcome to Kenya Power.This is our customer self service channel.\nIt seems like it is your first time here!.\nPlease reply with your first name.`;
    customer.create({phone:phone}).then(()=>{
    stage.create({stage:'0',customerPhone:phone}).then(()=>replyFunction(messageObj)).catch(err=>console.log(err));
    }).catch(err=>console.log(err));
}

//STAGE 0 FUNCTION
const stage0=(obj,phone,input)=>{
         customer.update({firstName:input},{where:{phone:phone}}).then(existingCustomer=>{
            stage.update({stage:'1'},{where:{customerPhone:existingCustomer}}).then(()=>{
                stage1(obj,phone);
             }).catch(err=>console.log(err));
         }).catch(err=>console.log(err)); 
}

//STAGE 1 FUNCTION
const stage1=(obj,phone)=>{
customer.findOne({where:{phone:phone}}).then(existingCustomer=>{
    obj.messages[0].content=`Hello ${existingCustomer.firstName}.Interacting with us is now pretty easy. \nPlease tell us what you would like to do.\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.`;
    stage.update({stage:'1'},{where:{customerPhone:phone}}).then(()=>replyFunction(obj)).catch(err=>console.log(err));
}).catch(err=>console.log(err));

}

//STAGE 1 OF 1 FUNCTION
const stage11=(obj)=>{
    obj.messages[0].content=`Please reply with Your 10-Digit meter number that starts with 0.\n0.Back.\n00.Home Menu`;
    replyFunction(obj);
}

//STAGE 2 0F 1 FUNCTIONS
const stage12=(obj)=>{
  obj.messages[0].content=`1.Buy Prepaid Tokens.\n2.Request Postpaid Tokens.\n0.Back.\n00.Home Menu`
  replyFunction(obj);
}


//STAGE 3 OF 1 FUNCTIONS
const fetchTokens=(obj,phone)=>{
token.findAll({where:{customerPhone:phone}}).then(lastTokens=>{
if(lastTokens){
  let tokens=`The following are your previous tokens:\n\nToken          Meter Number        Bought on`;
  lastTokens.forEach(token=>{
  tokens=tokens+`\n${token.tokenNumber}       ${token.meterMeterNumber}                  ${token.createdAt}\n`;
  });
  tokens+=`\n00.Home Menu.`;
  obj.messages[0].content=tokens;
  replyFunction(obj);
}else{
stage.update({stage:'1'},{where:{customerPhone:phone}}).then(()=>{
obj.messages[0].content=`You have never bought any tokens through this channel.\nPlease tell us what you would like to do.\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.`;
replyFunction(obj);
}).catch(err=>console.log(err));
}
}).catch(err=>console.log(err));

}

//STAGE 1 OF 1*2
const stage121=(obj,phone)=>{
  obj.messages[0].content=`0.Enter Meter Number.\n1.Choose from my meters.\n00.Back\n000.Home Menu`;
   replyFunction(obj);
}


//STAGE 2 OF 1*2
const stage122=(obj)=>{
  obj.messages[0].content=`Please proceed to any of the KPLC branded shops and request for the service.\n0.Back\n00.Home Menu`;
  replyFunction(obj);
}


//RETRIEVING A CUSTOMER METER NUMBERS
const fetchMeters=(obj,phone)=>{
   meter.findAll({where:{customerPhone:phone}}).then(existingMeters=>{
  if(existingMeters){
    let meters=`Kindly Reply with a meter Id.\nID     METERNUMBER\n`;
    existingMeters.forEach(existingMeter=>{
     meters=meters+`${existingMeter.id}.     ${existingMeter.meterNumber}\n`
    });
    meters=meters+`\n0.Back\n00.Home Menu`
   obj.messages[0].content=meters;
   replyFunction(obj);
  }else{
   obj.messages[0].content=`You do not have any save meters.\n0.Back\n00.Home Menu`;
  replyFunction(obj)
  }
  }).catch(err=>console.log(err));

}


//TERMINATION FUNCTION-when the customer has reached the termination of a converation.
 const endSession=(customerPhone)=>{
   stage.findOne({where:{customerPhone}}).then(sessionStage=>{
    session.create({steps:sessionStage.stage,customerPhone}).then(()=> console.log('Conversation ended successfully')).catch(err=>console.log(err));
   }).catch(err=>console.log(err));
}   

//FUNCTION TO GET THE AUTHORIZATION TOKEN FROM MPESA
const MpesaGenerateAuthToken=(req,res,next)=>{
  let request = unirest('GET', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
  request.headers({ 'Authorization': 'Basic WkJlYTFlVXlYRVVqRndvTmFLdnEycUJ6R2t1aTZaTEc6a2JiTzdpRkdUdXFLbVNsdg=='})
  request.send()
  request.end(res => {
	  if (res.error) console.log(res.error);
     console.log(res.raw_body);
     req.access_token=JSON.parse(res.raw_body).access_token;
     console.log(req.access_token);
     next();
     });
}

const registerUrls=(req,res)=>{
  let request = unirest('POST', ' https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl  ');
  request.headers({
    'Content-Type': 'application/json',
     'Authorization': "Bearer "+req.access_token})
     request .send(JSON.stringify({
    "ShortCode": 600981,
    "ResponseType": "Completed",
    "ConfirmationURL": "https://a360-154-157-216-55.ngrok.io/confirmation",
    "ValidationURL": "https://a360-154-157-216-55.ngrok.io/validation",
  }))
  request.end(res => {
	  if (res.error) console.log(res.error);
     console.log(res.raw_body);
     });
}


module.exports={
    errorFunction,
    replyFunction,
    sessionTimeout,
    startStage,
    messageObject,
    stage0,
    stage1,
    stage11,
    stage12,
    fetchTokens,
    stage121,
    stage122,
    fetchMeters,
    MpesaGenerateAuthToken,
    registerUrls
}