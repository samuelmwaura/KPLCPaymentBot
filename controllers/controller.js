const {customer,token,payment,meter,stage,session}= require('../models/KplcDatabaseModel');
const functions= require('./functions');

//SERVER RESPONSE TEST FUNCTION
const serverTestFunction=(req,res)=>{
    res.send('Testing the server');
}

//API CALLBACK HANDLER FUNCTION
const callbackHandler=(req,res)=>{
console.log(req.body.event);


//HANDLER VARIABLES
const customerInput= req.body.event.moText[0].content;//the message from the customer.
const customerPhone= req.body.event.moText[0].from;//the customer number.
//global.paymentMeter=0;

//SET TIMEOUT FUNCTION AND CALL - Customer stopped before the conversation is over
const sessionTimeout=()=>{  
   functions.endSession(customerPhone);
    stage.update({stage:'1'},{where:{customerPhone}}).then(()=>{
      functions.messageObject.messages[0].content='You stayed for too long without replying,Please begin another session:\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.';
      functions.replyFunction(functions.messageObject);
    }).catch(err=>console.log(err));
    }

//setTimeout(sessionTimeout,60000);

//CHECK FOR THE CUTOMER STAGE AND RESPOND---NOW IN THE MAIN BODY LOGIC
    customer.findOne({where:{phone:customerPhone}}).then(existingCustomer=>{
        if(existingCustomer){//AN EXISITING CUSTOMER
            stage.findOne({where:{customerPhone:customerPhone}}).then(customerStage=>{  
         switch (customerStage.stage){

             //IF AT THE VERY FIRST STAGE.
            case '0'://customer is set and the stage is zero- they didnt set the username.
               functions.stage0(functions.messageObject,customerPhone,customerInput);
               break;
            //AT THE HOME STAGE MENU
            case '1':
                switch(customerInput){
                 case '1':
                 functions.stage11(functions.messageObject);
                 stage.update({stage:'1*1'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                 break;
                 case '2':
                functions.stage12(functions.messageObject);
                stage.update({stage:'1*2'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                 break;
                 case '3':
                functions.fetchTokens(functions.messageObject,customerPhone);
                stage.update({stage:'1*3'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                //termination
                 break;
                 case '00':
                     functions.stage1(functions.messageObject,customerPhone);
                break;
                 default:
                 functions.messageObject.messages[0].content=`You entered invalid Option.\nInteracting with Kenya Power is pretty easy.Please tell us what you would like to do.\n1.Add a meter.\n2.Buy Tokens.\n3.View Previous tokens.`;
                 functions.replyFunction(functions.messageObject);
                 break;
                }
                
              break;
            case '1*1':
                switch(customerInput){
                case '0':
                 functions.stage1(functions.messageObject,customerPhone);
                break;
                case '00':
                 functions.stage1(functions.messageObject,customerPhone);
                 break;
                 default:
                if(isNaN(customerInput)){
                functions.messageObject.messages[0].content='Please confirm the meter number and re-enter it.\n0.Back\n00.Home Menu'
                functions.replyFunction(functions.messageObject);                
                }else{
                    const meterNumber=parseInt(customerInput);
                    const testRegExp = new RegExp("^[0-9]{10}$");// maximum amount for 2147483647.Verifiying the meter number.
                    if(!testRegExp.test(meterNumber)){
                     functions.messageObject.messages[0].content=`Please confirm the meter number and re-enter it.\n0.Back\n00.Home Menu`;
                     functions.replyFunction(functions.messageObject);
                    }else{
                                    
                meter.findOne({where:{meterNumber}}).then( existingMeter=>{
                    if (existingMeter){
                   functions.messageObject.messages[0].content=`The meter number ${customerInput} is already in your list of meters.\n00.Home Menu`;
                   functions.replyFunction(functions.messageObject);
                   functions.endSession(customerPhone);
                   } else{
                   meter.create({meterNumber,customerPhone}).then(()=>{
                   functions.messageObject.messages[0].content=`Meter number ${customerInput} added successfully to your meters.\n0.Back\n00.Home`;
                   functions.replyFunction(functions.messageObject);
                   functions.endSession(customerPhone);
                   functions.stage1(functions.messageObject,customerPhone);
                   }).catch(err=>console.log(err));
                   }
                   }).catch(err=>console.log(err));
                    };                    
                }
                break;
                }

            break;        
            case '1*2':
                switch(customerInput){
                case '1':
                    functions.stage121(functions.messageObject);
                    stage.update({stage:'1*2*1'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                break;
                case '2':
                     functions.stage122(functions.messageObject);
                     stage.update({stage:'1*2*2'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                break;
                case '0':
                    functions.stage1(functions.messageObject,customerPhone); 
                break;
                case '00':
                    functions.stage1(functions.messageObject,customerPhone);
                break;
                default:
                    functions.messageObject.messages[0].content=`Please enter a valid choice.\n1.Buy Prepaid Tokens.\n 2.Request Postpaid Tokens.\n0.Back\n00.Home Menu`;
                    functions.replyFunction(functions.messageObject);
                break;

                }
               
            break;
            case '1*2*1':
                switch(customerInput){
                    case '00':
                        functions.stage12(functions.messageObject);
                        stage.update({stage:'1*2'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                    break;
                    case '000':
                        functions.stage1(functions.messageObject,customerPhone);
                    break;
                    case '0':
                        functions.stage11(functions.messageObject);
                        stage.update({stage:'1*2*1*0'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                    break;
                     case '1':
                         functions.fetchMeters(functions.messageObject,customerPhone);
                         //stage.update({stage:'1*2*1*1'},{where:{customerPhone}}).then().catch(err=>console.log(err))
                    break;
                    default:
                       functions.messageObject.messages[0].content=`You entered an invalid choice.\n0.Enter Meter Number.\n1.Choose from my meters.\n00.Back\n000.Home Menu`;
                       functions.replyFunction(functions.messageObject);
                    break;
                }
            break;
            case '1*2*2':
                 switch(customerInput){
                     case '0':
                     functions.stage12(functions.messageObject);
                     stage.update({stage:'1*2'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                     break;
                     case '00':
                     functions.stage1(functions.messageObject,customerPhone);
                     break;
                     default:
                     functions.messageObject.messages[0].content=`Not a valid options!\n0.Back.\n00.Home Menu`
                     functions.replyFunction(functions.messageObject);
                     break;

                 }
             break;
            case '1*2*1*0'://no function to handle this in the functions file since it is just a step to accept and process input. Nothing to show. 
                 switch(customerInput){
                  case '0':
                      functions.stage121(functions.messageObject);
                      stage.update({stage:'1*2*1'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                  break;
                  case '00':
                      functions.stage1(functions.messageObject,customerPhone);
                  break;
                  default:

                       if(isNaN(customerInput)){
                   functions.messageObject.messages[0].content='You entered an invalid meter Number.Reply With a valid meter Number.\n0.Back\n00.Home Menu`'
                   functions.replyFunction(functions.messageObject);
                     }else{
                        const meterNumber=parseInt(customerInput);
                       // Logic to verify KPLC meter format.   
                       const testRegExp = new RegExp("^[0-9]{10}$");// maximum amount for 2147483647
                    if(!testRegExp.test(meterNumber)){
                     functions.messageObject.messages[0].content=`You entered an invalid meter Number.Reply With a valid meter Number.\n0.Back\n00.Home Menu`;
                     functions.replyFunction(functions.messageObject)
                    }else{
                        req.paymentMeter=existingMeter;
                        stage.update({stage:'1*2*1*0*amount'}).then().catch(err=>console.log(err));
                        functions.amountFunction(functions.messageObject);
                    //functions.paymentFunction(functions.messageObject,customerPhone,meterNumber);
                    };                                         
                     }
                   break;

                 }
             break;
            case '1*2*1*1':
                 switch(customerInput){
                 case '00':
                     functions.stage1(functions.messageObject,customerPhone);
                 break;
                 case '0':
                    functions.stage121(functions.messageObject);
                    stage.update({stage:'1*2*1'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                break;
                 default:
                     if(isNaN(customerInput)){
                   functions.messageObject.messages[0].content='Please reply again with a Valid meter Id.\n0.Back\n00.Home Menu`'
                   functions.replyFunction(functions.messageObject);
                     }else{
                        const meterId=parseInt(customerInput);
                        meter.findOne({where:{id:meterId}}).then(existingMeter=>{
                        if(existingMeter){                            
                            req.paymentMeter+=existingMeter;
                            stage.update({stage:'1*2*1*1*amount'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                            functions.amountFunction(functions.messageObject);
                            //functions.paymentFunction(functions.messageObject,amount,customerPhone,existingMeter);
                        }else{
                            functions.messageObject.messages[0].content=`You entered a wrong Id for a meter.Please renter a valid meter Id from your meters.\n0.Back\n00.Home Menu`;
                            functions.replyFunction(functions.messageObject);
                        }
                       
                        }).catch(err=>console.log(err));                     
                     }
                 break;
                
                 }

             break;  
            //  case 'termination':
            //      switch(customerInput){
            //     case '00' :
            //         functions.stage1(functions.messageObject,customerPhone);
            //     break;
            //     case '0':
            //         stage.update({stage:'121'},{where:{customerPhone}}).then(()=>functions.stage121(functions.messageObject)).catch(err=>console.log(err));
            //     break;
            //     default:

            //     break;
            //      }
            //  break;
             case '1*3':
                 switch(customerInput){
                    case '00':
                        functions.endSession(customerPhone);
                        functions.stage1(functions.messageObject,customerPhone);
                    break;
                    default:
                    functions.endSession(customerPhone);
                     functions.messageObject.messages[0].content='You entered an Invalid option. you are being taken to the previous menu.'
                     functions.replyFunction(functions.messageObject);
                     functions.stage1(functions.messageObject,customerPhone);
                    break;
                 }
             break;    

            //TERMINATION FUNCTION
             case '1*2*1*0*amount':
                 console.log(req.paymentMeter);
                 switch(customerInput){
                    case '00':
                        functions.stage1(functions.messageObject,customerPhone);
                    break;
                    default:
                        if(isNaN(customerInput)){
                            functions.messageObject.messages[0].content='You did not enter a valid value for amount.Reply with a valid amount.\n00.Home Menu`'
                            functions.replyFunction(functions.messageObject);
                              }else{
                                 const amount=parseInt(customerInput);
                                functions.paymentFunction(functions.messageObject,amount,customerPhone,req.paymentMeter);                                                
                              }                        
                    break;

                 }
             break;     
             
             
             //TERMINATION FUNCTION
             case '1*2*1*1*amount':
                 console.log(req.paymentMeter);
                 switch(customerInput){
                    case '00':
                        functions.stage1(functions.messageObject,customerPhone);
                    break;
                    default:
                        if(isNaN(customerInput)){
                            functions.messageObject.messages[0].content='You did not enter a valid value for amount.Reply with a valid amount.\n00.Home Menu`'
                            functions.replyFunction(functions.messageObject);
                              }else{
                                 const amount=parseInt(customerInput);
                                functions.paymentFunction(functions.messageObject,amount,customerPhone,req.paymentMeter);                                                
                              }                        
                    break;

                 }
             break;               

         }          

            }).catch(functions.errorFunction);
        }
    

        // CUSTOMER  NOT REGISTERED BEFORE
        else{
         functions.startStage(functions.messageObject,customerPhone);
        }           

    }).catch(err=>console.log(err));
   
    
                  
}

//HANDLE THE MESSAE STATUS CALLBACKS
const statusHandler=(req, res)=>{
  console.log(req.body.event.messageStatusUpdate[0]);

}

module.exports={
    callbackHandler,
    serverTestFunction,
    statusHandler
}