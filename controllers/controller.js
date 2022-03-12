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

   
setTimeout(functions.sessionTimeout,180000);

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
                functions.stage13(functions.messageObject,customerPhone);
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
                const meterNumber=parseInt(customerInput);
               //here goes the logic to verify the meter number by Kplc. After verification the number is saved to db.
                
                meter.findOne({where:{meterNumber}}).then( existingMeter=>{
                 if (existingMeter){
                functions.messageObject.messages[0].content=`The meter number ${customerInput} is already in your list of meters.\n00.Home Menu`;
                functions.replyFunction(functions.messageObject);
                } else{
                meter.create({meterNumber,customerPhone}).then(async ()=>{
                functions.messageObject.messages[0].content=`Meter number ${customerInput} added successfully to your meters.\n0.Back\n00.Home`;
                functions.replyFunction(functions.messageObject);
                }).catch(err=>console.log(err));
                }
                }).catch(err=>console.log(err));
                break;
                }

            break;        
            case '1*2':
                switch(customerInput){
                case '1':
                    functions.stage121(functions.messageObject,customerPhone);
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
                    functions.messageObject.messages[0].content=`Please enter a valid choice.\n1.Buy Prepaid Tokens.\n 2.Request Postpaid Tokens.\n00.Home Menu`;
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
                      functions.stage121(functions.messageObject,customerPhone);
                      stage.update({stage:'121'},{where:{customerPhone}}).then().catch(err=>console.log(err));
                  break;
                  case '00':
                      functions.stage1(functions.messageObject,customerPhone);
                  break;
                  default:
                      const id = parseInt(customerInput);
                      meter.findOne({where:{id}}).then((existingMeter)=>{
                      if(existingMeter){

                      //LOGIC TO COMPLETE THE PAYMENT

                      }else{
                      functions.messageObject.message[0].content=`Not a VALID Meter ID.PLease reply with the meter Id.\nPlease indicate the meter to buy for.\n0.Enter Meter Number or.\n Reply with Id of your meters below.\nID     METERNUMBER\n${functions.fetchMeters(phone)}.\n00.Back\n000.Home Menu`
                      }
                      }).catch(err=>console.log(err));
                   break;

                 }
             break;
            case '1*3':

               
            break;
            case '1*1*1':
                
            break;
            case '1*1*2':
               
                break;
            case '1*2*1':
               
                break;
            case '1*2*2':
                           
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