//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
/// <reference path="../lib/types.d.ts" />
require('../locales/zh_CN');
var Parser = require("./Parser");
var Run = require("./Run");
var Build = require("./Build");
var Publish = require("./Publish");
var Create = require("./Create");
var server = require('../server/server');
var BuildService = require("./BuildService");
global.lark = global.lark || {};
function executeCommandLine(args) {
    var options = Parser.parseCommandLine(args);
    lark.options = options;
    if (options.autoCompile) {
        if (options.action == 'startserver') {
            startAutoBuildService(options);
            server.startServer(options);
        }
        else {
            new Run(options).run();
            console.log('Auto build server is still running...');
        }
    }
    else {
        var exitCode = executeOption(options);
        process.exit(exitCode);
    }
}
exports.executeCommandLine = executeCommandLine;
function executeOption(options) {
    var exitCode = 0;
    startAutoBuildService(options);
    switch (options.action) {
        case "publish":
            var publish = new Publish(options);
            exitCode = publish.run();
            break;
        case "create":
            var create = new Create(options);
            exitCode = create.run();
            break;
        default:
            var build = new Build(options);
            exitCode = build.run();
            break;
    }
    return exitCode;
}
exports.executeOption = executeOption;
function startAutoBuildService(options) {
    if (BuildService.instance == null) {
        BuildService.instance = new BuildService();
        BuildService.instance.start(options);
    }
}
//# sourceMappingURL=Entry.js.map