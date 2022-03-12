const sendingFile=require('../sendingFile');
const request= require('request');
const {customer,token,payment,meter,stage,session}= require('../models/KplcDatabaseModel');


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
const sessionTimeout=()=>{
    stage.findOne({where:{customerPhone}}).then((sessionStages)=>{
        endSession(sessionStages.stage,'1');
        messageObject.messages[0].content='You stayed for too long without replying,Please begin another session:\n1. Buy tokens.\n2. Report Outages.\n3. Check meter status.';
        sendingFunction();
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
    obj.messages[0].content=`Please reply with Your meter number.\n0.Back.\n00.Home Menu`;
    replyFunction(obj);
}

//STAGE 2 0F 1 FUNCTIONS
const stage12=(obj)=>{
  obj.messages[0].content=`1.Buy Prepaid Tokens.\n 2.Request Postpaid Tokens.\n0.Back.\n00.Home Menu`
  replyFunction(obj);
}


//STAGE 3 OF 1 FUNCTIONS
const stage13=(obj,phone)=>{
token.findAll({where:{customerPhone:phone}}).then(lastTokens=>{
  let tokens='';
if(lastTokens){
  lastTokens.forEach(token=>{
  tokens+=`\n${token.id}`;
  });
  obj.messages[0].content=tokens;
  replyFunction(obj);

}else{
stage.update({stage:'1'},{where:{customerPhone:phone}}).then(()=>{
obj.messages[0].content=`You have never bought any tokens through this channel.\nPlease tell us what you would like to do.\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.`;
}).catch(err=>console.log(err));
}
}).catch(err=>console.log(err));

// token.findAll({where:{customerPhone:phone}}).then(previousTokens=>{
//     if(previousTokens){
//      previousTokens.forEach(previousToken=>{
//          let tokens='';
//          tokens=tokens+previousToken+'\n';
//      });
//      obj.messages[0].content=`${tokens}`
//     }else{
//      obj.message[].content='You have never bought Tokens '
//     }
// }).catch(errorFunction);

}

//STAGE 1 OF 1*2
const stage121=(obj,phone)=>{
   obj.messages[0].content=`Please indicate the meter to buy for.\n0.Enter Meter Number .\n${fetchMeters(phone)}.\n00.Back\n000.Home Menu`;
   replyFunction(obj);
}


//STAGE 2 OF 1*2
const stage122=(obj)=>{
  obj.messages[0].content=`Please proceed to any of the KPLC branded shops and request for the service.\n0.Back\n00.Home Menu`;
  replyFunction(obj);
}


//RETRIEVING A CUSTOMER METER NUMBERS
const fetchMeters=(phone)=>{
meter.findAll({where:{customerPhone:phone}}).then(existingMeters=>{
    if(existingMeters){
    let meters='';
     existingMeters.forEach(existingMeter=>{
      meters=meters+existingMeter.id+'   '+existingMeter.meterNumber+'\n';
     });
     return meters;
    }else{
      return 'No meters';
    }
}).catch(err=>console.log(err))
}


//TERMINATION FUNCTION-when the customer has reached the termination of a converation.
 const endSession=(sessionStages,lastStep)=>{
    session.create({steps:sessionStages+'*'+lastStep,customerPhone}).then(()=>{
    stage.update({stage:'1'},{where:{customerPhone}}).then(()=>console.log('Conversation ended successfully')).catch(err=>console.log(err));
    }).catch(err=>console.log(err));
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
    stage13,
    stage121,
    stage122,
    fetchMeters
}