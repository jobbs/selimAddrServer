
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var docs = require('./model/collection_phonebook');
var mongoose = require('mongoose');
var redis = require('redis');
var http = require('http');
var path = require('path');
var fs = require('fs');
var formidable = require('formidable');
var img = require('easyimage');
var nodemailer = require('nodemailer');

var pagination = require('pagination');
var app = express();
//var client = redis.createClient(6379,'localhost',null);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('env','development');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({secret:"selim"}));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}

//MongoDB 연결
var adminDocs = docs.Admin(mongoose);
docs = docs.Document(mongoose);

//List

app.get('/selimList.:format', function(req, res) {
	
	var	page_num= 1,
	totalcnt = 0,
	page_list = 0,
	results_per_page= 6;

    var searchFilter = {};

	if(req.param('currPage')!=undefined){
		page_num = req.param('currPage');
	}
    if(req.param('searchFilter')!=undefined){
        searchFilter = {name: req.param('searchFilter')};
    }
	var query = docs.find(searchFilter,function(err,data){

    }).sort({group: 1,no: 1});

    var countQuery = docs.find(searchFilter);
    countQuery.count(function(err,count){
		totalcnt = count;
		page_list = Math.ceil(totalcnt/results_per_page);
        var paginator = new pagination.SearchPaginator({prelink:'/selimList.html?currPage=', current: page_num, rowsPerPage: results_per_page, totalResult: totalcnt});
        var paging = paginator.getPaginationData();
		query.skip((page_num-1)*results_per_page).limit(results_per_page).exec('find',function(err,data){
			console.log("currPage:::"+err);
			res.render("index",{data: data,size: data.length,pageList: page_list,currPage: page_num,paging: paging});
            res.end();
		});
	});
	/*client.hkeys("selim", function (err, replies) {
        console.log(replies + " replies:");
        replies.forEach(function (reply, i) {
            				client.hget("selim",reply,function(err,data){ 
            										if(replies.length >i+1){
            										 list.push(data);            									
            										}else	if(replies.length == i+1){            																
            											console.log(list);
            											res.render("index",{data:list,size:replies.length});
            										}
            				});      								
            		
            				
        		});
     
		
        });*/
	
	
});

//관리자 정보 조회

app.get('/inspectAdmin.:format?', function(req, res) {

    var adminId = req.param('adminId');
    var password = req.param('password');
    var flag = 'N';
    var query = adminDocs.findOne({adminId: adminId,password: password},function(err,data){

        if(err){
            console.log(err);
            throw new err;
        }
        console.log(data);
        if(data != undefined){
            flag = 'Y';
        }

        res.send(flag);
        res.end();
    });

});

//직원 정보 상세 조회

app.get('/selimView.:format?', function(req, res) {

var empl_id = req.param('no');
    var query = docs.findOne({no: empl_id},function(err,data){
        console.log(data);
        res.render('selimView',{data: data});
        res.end();
    });

});

//직원 정보 입력폼으로 이동

app.get('/insertForm.:format?', function(req, res) {

   var query =  docs.find({});

   var groupList = docs.find({});

    query.sort('-no').limit(1).exec(function(err,data){

        var maxValue = (data[0].no)+1;

        groupList.distinct('group').exec(function(err,data){

           var result = data;

            res.render('insertForm',{max: maxValue, groupList: result});
            res.end();

        });

    });

});

//직원 정보 MongoDB에 저장

app.post('/insertData.:format?', function(req, res) {

    var imgs = ['jpg'];
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname+'/public/images/selimPhoto';
    form.keepExtensions = true;
    var fields = [];

    form.on('error', function(err) {

            console.log('err');
            throw err;
        })
        /* this is where the renaming happens */

        .on ('fileBegin', function(name, file){
        if(file.size > 0) {
            //rename the incoming file to the file's name
            file.path = form.uploadDir + "/" + file.name;
        }

        }).on('progress', function(bytesReceived, bytesExpected) {

            //self.emit('progess', bytesReceived, bytesExpected)

            console.log('progress');
            var percent = (bytesReceived / bytesExpected * 100) | 0;
            process.stdout.write('Uploading: %' + percent + '\r');

        }).on('end',function(req,res){

            console.log('form end:\n\n');

        });

    form.parse(req,function(err,fields){

        var collect = new docs(fields);

        collect.save({safe:true},function(err,data) {

            if (err) {

                console.err(err);

                throw err;

            }

            res.redirect('/selimList.html');
            res.end();

        });

        console.log('form parse :\n\n');
    });

});

//직원 정보 수정폼으로 이동

app.get('/modifyForm.:format?', function(req, res) {

    var groupList = docs.find({});
    var modifyData = {};
    docs.findOne({no:req.param('no')},function(err,data){

        modifyData = data;

        groupList.distinct('group').exec(function(err,data){

            var result = data;

            res.render('modifyForm',{data: modifyData, groupList: result});
            res.end();

        });

    });
});

//직원 정보 Mongodb 수정

app.post('/updateData.:format?', function(req, res) {

    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname+'/public/images/selimPhoto';
    form.keepExtensions = true;
    var fields = [];

    form.on('error', function(err) {

        console.log('err');
        throw err;
    })
        //* this is where the renaming happens *//*

        .on ('fileBegin', function(name, file){

        if(file.size > 0){
        //rename the incoming file to the file's name
        file.path = form.uploadDir + "/" + file.name;
        }

    }).on('progress', function(bytesReceived, bytesExpected) {

            //self.emit('progess', bytesReceived, bytesExpected)

            console.log('progress');
            var percent = (bytesReceived / bytesExpected * 100) | 0;
            process.stdout.write('Uploading: %' + percent + '\r');

        }).on('end',function(req,res){

            console.log('form end:\n\n');

        });

    form.parse(req,function(err,fields){

       // var collect = new docs(fields);
       // console.log(fields.group);
        docs.update(
            {no: fields.no},
            {$set:
                {group: fields.group,
                 position: fields.position,
                 nickname: fields.nickname,
                 mobile: fields.mobile,
                 addr: fields.addr,
                 birth: fields.birth,
                 marriage: fields.marriage }},
            {safe:true},function(err,data) {

            if (err) {

                console.err(err);

                throw err;

            }

            res.redirect('/selimList.html');
            res.end();

        });

        console.log('form parse :\n\n');
    });

});

//직원끼리 간단한 이메일보내기

app.post('/sendEmail', function(req, res) {

    var sender = req.param('sender');
    var senderEmail = req.param('senderEmail');
    var reciever = req.param('reciever');
    var subject = req.param('subject');
    var contents = req.param('contents');
    // var transport = nodemailer.createTransport("sendmail");
    var transport = nodemailer.createTransport("SMTP", {
        host: "211.234.68.153",
        port: 25
    });
    var mailOptions = {
        from: '세림'+' <'+senderEmail+'>',
        to: reciever,
        subject: subject,
        text: contents
    };

    transport.sendMail(mailOptions, function(error, response) {

        if (error) {

            console.log(error);
            res.send(error);
            res.end();

        } else {

            console.log("Message sent: " + response.message);
            res.send("Y");
            res.end();

        }

        transport.close(); // 필요 없으니 종료!!

    });

});

//Read

app.get('/teamGraph', function(req, res) {

    docs.aggregate(
        {$group:
            {_id:'$group',
             count:
                {$sum:1}
            }
        },
        function(err,data){
            console.log(JSON.stringify(data));
            res.render('teamGraph',{data:data});
            res.end();
        });

});

//Update

app.put('/documents/:id.:format?', function(req, res) {

});

//Delete

app.del('/delete', function(req, res) {

    docs.remove({'no': req.param('no')},{safe:true},function(err){
        if(err){
            res.send('N');
        }
        res.send('Y');
    });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
