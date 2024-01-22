const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title:{
        type:String,
    },
    image:{
        type:String,
    },
    description:{
        type:String,
    },
    price:{
        type:String,
    },
    rating:{
        type:String,
    },
    price:{
        type:String,
    },
    category:{
        type:String,
    }
})

module.exports = mongoose.model('Product',productSchema);