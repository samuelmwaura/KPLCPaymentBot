const dotenv= require('dotenv');
dotenv.config();
clickatellkey=process.env.clickatellkey;


const options = {
  url: 'https://platform.clickatell.com/v1/message',
  method: "POST",
  headers: {
    'Content-type': 'application/json',
    'Authorization':clickatellkey
  }
};


function onResponseReceipt(error, response, body) {
  console.log("Function triggered on response");
  if (!error) {
    const reply = (JSON.parse(body));
    console.log(reply);
    console.log("status 200");
    console.log(reply.messages[0].error);
  }
  else {
    console.log(error);
  }
}

module.exports={
    options,
    onResponseReceipt
};