/**
 * 'api/alarms': Alarms API to GET/POST alarms data
 */

var express = require("express");
const authJwt = require('../jwt-helper');
const { PassThrough } = require('stream');
var runtime;
var secureFnc;
var checkGroupsFnc;

module.exports = {
    init: function (_runtime, _secureFnc, _checkGroupsFnc) {
        runtime = _runtime;
        secureFnc = _secureFnc;
        checkGroupsFnc = _checkGroupsFnc;
    },
    app: function() {
        var alarmsApp = express();
        alarmsApp.use(function(req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });

        /**
         * GET current Alarms 
         * Take from alarms storage and reply 
         */
        alarmsApp.get("/api/alarms", secureFnc, function(req, res) {
            var groups = checkGroupsFnc(req);			
			 if (res.statusCode === 403) {
                runtime.logger.error("api get alarms: Tocken Expired");
            } else {	
                try {
                    var result = runtime.alarmsMgr.getAlarmsValues(req.query, groups);
                    // res.header("Access-Control-Allow-Origin", "*");
                    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    if (result) {
                        res.json(result);
                    } else {
                        res.end();
                    }
                } catch (err) {
                    if (err.code) {
                        res.status(400).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api get alarms: " + err.message);
                }       
			}			
        });

                /**
         * GET current Alarms 
         * Take from alarms storage and reply 
         */
        alarmsApp.get("/api/alarmsHistory", secureFnc, function(req, res) {
            var groups = checkGroupsFnc(req);	
			if (res.statusCode === 403) {
                runtime.logger.error("api get alarms: Tocken Expired");
            } else {	
                runtime.alarmsMgr.getAlarmsHistory(req.query, groups).then(result => {
                    // res.header("Access-Control-Allow-Origin", "*");
                    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    if (result) {
                        res.json(result);
                    } else {
                        res.end();
                    }
                }).catch(function(err) {
                    if (err.code) {
                        res.status(400).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api get alarms: " + err.message);
                });    
			}            
        });

        /**
         * POST Alarm ACK
         * Set alarm ack
         */
        alarmsApp.post("/api/alarmack", secureFnc, function(req, res, next) {
            var groups = checkGroupsFnc(req);			
			 if (res.statusCode === 403) {
                runtime.logger.error("api post alarms: Tocken Expired");
            } else {		
                runtime.alarmsMgr.setAlarmAck(req.body.params, req.userId, groups).then(function(data) {
                    res.end();
                }).catch(function(err) {
                    if (err.code) {
                        res.status(err.code).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api post alarm-ack: " + err.message);
                });    
		  }            
        });

        /**
         * POST Alarms clear
         */
        alarmsApp.post("/api/alarmsClear", secureFnc, function(req, res, next) {
            var groups = checkGroupsFnc(req);
			 if (res.statusCode === 403) {
                runtime.logger.error("api post alarms: Tocken Expired");
            } else if (authJwt.adminGroups.indexOf(groups) === -1 ) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post alarms: Unauthorized");
            } else {
            runtime.alarmsMgr.clearAlarms(req.body.params).then(function() {
                runtime.alarmsMgr.reset();
                res.end();
            }).catch(function(err) {
                if (err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api post alarms-clear: " + err.message);
            });      
		  }			
        });
        alarmsApp.post("/api/alarms/Excel", secureFnc, async function(req, res, next) {
            var groups = checkGroupsFnc(req);
            if (res.statusCode === 403) {
                runtime.logger.error("api post alarms: Tocken Expired");
            } else if (authJwt.adminGroups.indexOf(groups) === -1 ) {
                res.status(401).json({error:"unauthorized_error", message: "Unauthorized!"});
                runtime.logger.error("api post alarms: Unauthorized");
            } else {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                try{
                    var stream = new PassThrough();
                    let data;
                    let sheetName;
                    sheetName = req.body.sheetName;
                    if(req.body.type === 1){
                        data = await runtime.alarmsMgr.getAlarmsHistory(req.body, groups);
                    }else {
                        data = await runtime.alarmsMgr.getAlarmsValues(req.body, groups);
                    }
                    res.setHeader("Content-Disposition", "attachment; filename=" + `${encodeURIComponent(sheetName)}.xlsx`);
                    await runtime.excelsMgr.excelJsExport({sheetName: sheetName, headerColumns:req.body.headerInfo, tableData: data, dicts: req.body.dicts }, stream);
                    stream.pipe(res);
                    stream.end();
                }catch(err) {
                    stream.end();
                    if (err.code) {
                        res.status(400).json({error:err.code, message: err.message});
                    } else {
                        res.status(400).json({error:"unexpected_error", message:err.toString()});
                    }
                    runtime.logger.error("api post alarms-clear: " + err.message);
                };
            }
        });
        return alarmsApp;

    }

}
