/**
 * New node file
 */

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/nodepad');

var Schema = mongoose.Schema,
		 ObjectId = mongoose.ObjectId;

   Document = new Schema(	   
	  {no: Number, group: String, position: String, name: String, nickname:String , mobile: String, addr: String, birth: String, marriage: String},
	  {collection : 'empl'}
     );

    adminDoc = new Schema(
        {adminId: String, password: String},
        {collection : 'admin'}
    );

    var Document = mongoose.model('Document', Document);
    var adminDoc = mongoose.model('adminDoc', adminDoc);


   exports.Document = function(db){
	   
	   return db.model('Document');
	   
   };

    exports.Admin = function(db){
        return db.model('adminDoc');
    };
