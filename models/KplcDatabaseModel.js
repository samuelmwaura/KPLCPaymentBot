const Sequelize= require('sequelize');
const sequelize = require('../database/connection');

const customerSchema={
    firstName:{
        type:Sequelize.STRING(20),
        allownull:false
    },
    phone:{
        type:Sequelize.STRING(12),
        allowNull:false,
        unique:true,
        primaryKey:true
    }

}

const stageSchema={
    id:{
        type:Sequelize.INTEGER(10),
        allowNull:false,
        primaryKey:true,
        autoIncrement:true,
        unique:true
    },
    stage:{
        type:Sequelize.STRING(20),
        allowNull:false,
        unique:true
    }
}

const sessionSchema={
    id:{
        type:Sequelize.INTEGER(10),
        primaryKey:true,
        autoIncrement:true,
        unique:true,
        allowNull:false
    },
    steps:{
        type:Sequelize.STRING(20),
        allowNull:false,
     }
     
}

const tokenSchema={

    tokenNumber:{        
        type:Sequelize.STRING(30),
        allowNull:false,
        unique:true,
        primaryKey:true
    },
    meterNumber:{
        type:Sequelize.BIGINT(20),
        allowNull:false,
        primaryKey:true
    }
}

const paymentSchema={
      paymentId:{
          type:Sequelize.INTEGER(20),
          allowNull:false,
          primaryKey:true,
          autoIncrement:true
      },
      amount:{
          type:Sequelize.INTEGER(10),
          allowNull:true,
          unique:false
      }
}
const meterSchema={
    id:{
        type:Sequelize.INTEGER(10),
        autoIncrement:true,
        unique:true,
        allowNull:false
    },
    meterNumber:{
        type:Sequelize.BIGINT(20),
        allowNull:false,
        primaryKey:true
    }
}

// const initiatedPayments={
//      id:{

//      },
     
}

const customer=sequelize.define('customer',customerSchema,{timestamps:true});
const stage=sequelize.define('stage',stageSchema,{timestamps:true});
const session=sequelize.define('session',sessionSchema,{timestamps:true});
const meter=sequelize.define('meter',meterSchema,{timestamps:true});
const payment=sequelize.define('payment',paymentSchema,{timestamps:true});
const token=sequelize.define('token',tokenSchema,{timestamps:true});

customer.hasMany(meter);
customer.hasMany(session);
customer.hasOne(stage);
customer.hasMany(payment);
customer.hasMany(token);
token.hasOne(payment);
token.hasOne(payment);
   
module.exports={
    customer,
    stage,
    session,
    meter,
    payment,
    token
}