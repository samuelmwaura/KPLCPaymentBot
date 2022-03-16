const sendingFile=require('../sendingFile');
const request= require('request');
const {customer,token,payment,meter,stage,session}= require('../models/KplcDatabaseModel');
const unirest=require('unirest');
const Mpesa=require('mpesa-api').Mpesa;

//STK PUSH STK
const today=new Date();
const timestamp= today.getFullYear()+''+today.getMonth()+''+today.getDate()+''+today.getHours()+''+today.getMinutes()+''+today.getSeconds();
const initiatorPassword=Buffer.from('174379'+'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'+timestamp).toString('base64');
const credentials={
  clientKey: 'ZBea1eUyXEUjFwoNaKvq2qBzGkui6ZLG',
  clientSecret: 'kbbO7iFGTuqKmSlv',
  initiatorPassword:initiatorPassword,
  certificatePath: null
};

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
    obj.messages[0].content=`Please reply with Your 10-Digit meter number.\n0.Back.\n00.Home Menu`;
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
if(lastTokens.length>0){
  console.log(lastTokens);
  let tokens=`The following are your previous tokens:\n\n`;
  lastTokens.forEach(token=>{
  tokens=tokens+`\nToken:        ${token.tokenNumber}\nMeter Number: ${token.meterNumber}\nBought on:    ${token.createdAt}\n\n`;
  });
  tokens+=`\n00.Home Menu.`;
  obj.messages[0].content=tokens;
  replyFunction(obj);
}else{
stage.update({stage:'1'},{where:{customerPhone:phone}}).then(()=>{
obj.messages[0].content=`You have never bought any tokens through this channel.\nPlease tell us what else you would like to do.\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.`;
replyFunction(obj);
}).catch(err=>console.log(err));
}
}).catch(err=>console.log(err));

}

//STAGE 1 OF 1*2
const stage121=(obj)=>{
  obj.messages[0].content=`0.Enter Meter Number.\n1.Choose from my meters.\n00.Back\n000.Home Menu`;
   replyFunction(obj);
}


//STAGE 2 OF 1*2
const stage122=(obj)=>{
  obj.messages[0].content=`Please proceed to any of the KPLC branded shops and request for the service.\n0.Back\n00.Home Menu`;
  replyFunction(obj);
}


//RETRIEVING A CUSTOMER METER NUMBERS
const fetchMeters=(obj,customerPhone)=>{
   meter.findAll({where:{customerPhone}}).then(existingMeters=>{
  if(existingMeters.length>0){
    let meters=`Kindly Reply with a meter Id.\nID     METERNUMBER\n`;
    existingMeters.forEach(existingMeter=>{
     meters=meters+`${existingMeter.id}.     ${existingMeter.meterNumber}\n`
    });
    meters=meters+`\n0.Back\n00.Home Menu`
   obj.messages[0].content=meters;
   replyFunction(obj);
   stage.update({stage:'1*2*1*1'},{where:{customerPhone}}).then().catch(err=>console.log(err))
  }else{
   obj.messages[0].content=`You do not have any saved meters.\n0.Enter Meter NUmber.\n00.Back\n000.Home Menu`;
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

//CONFIRMATION OF THE PAYMENT INFORMATION
const confirmPayment=(obj)=>{
obj.message[0].content=`PLease confirm payment of amount ${amount} to purchase tokens for the meter ${meterNumber}`;
replyFunction(obj);
}

//GENERATE TOKEN
const generateToken=(obj,customerPhone,meterNumber)=>{
const tokenNumber = (Math.floor(Math.random() * 1000000006780789090809) + 1000087).toString().substring(1);
console.log(tokenNumber);
obj.messages[0].content=`Your token is: ${tokenNumber}.\n0.Back\n00.Home Menu`;
token.create({tokenNumber,customerPhone,meterNumber}).then(()=>{
replyFunction(obj);
}).catch(err=>console.log(err))
}

//STK PUSH FUNCTION 
const paymentFunction=(obj,amount,customerPhone,meterNumber)=>{
const mpesa = new Mpesa(credentials,'sandbox');
const body={
  BusinessShortCode:174379,
      Amount:amount,
      PartyA:customerPhone,
      PartyB: 174379,
      PhoneNumber: customerPhone,
      CallBackURL: "https://86e6-197-248-114-233.ngrok.io/mpesaPush",
      AccountReference: "KenyaPower",
      passKey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
      TransactionType: "CustomerPayBillOnline" /* OPTIONAL */,
      TransactionDesc: "Payment for KenyaPower Prepaid Tokens" /* OPTIONAL */,
}
mpesa.lipaNaMpesaOnline(body).then(response=>{// the call to push the stk to the customer.
  console.log(response);
  generateToken(obj,customerPhone,meterNumber);
  endSession(customerPhone);
  stage.update({stage:'1'},{where:{customerPhone}}).then().catch(err=>console.log(err));  
}).catch(err=>console.log(err));

}

//TERMINATION FUNCTION
const amountFunction=(obj,meter)=>{
obj.messages[0].content='Enter the amount.\n00.Home Menu';
replyFunction(obj);
}

//VERIFY SUCCESS PAYMENT



//MPESA STK PUSH HANDLER FUNCTION.
const mpesaPush=(req,res)=>{
console.log(req.body)
}


module.exports={
    errorFunction,
    replyFunction,
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
    endSession,
    generateToken,
    MpesaGenerateAuthToken,
    mpesaPush,
    paymentFunction,
    amountFunction
}