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

import Action = require('./Action');
import FileUtil = require("../lib/FileUtil");
import BuildService = require('./BuildService');


class Build extends Action {
    static inProgress = false;
    public run():number {
        var exitCode = 0;

        if (this.options.autoCompile) {
            BuildService.getInstance(this.options);
        }

        if (this.options.fileName) {
            console.log('build file:' + this.options.fileName);
            exitCode = BuildService.buildSingle(this.options.fileName);
            return exitCode;
        }

        if (Build.inProgress) {
            console.log('Another build task is in progress');
            return exitCode;
        }

        Build.inProgress = true;
        console.log('build start');
        try {
            this.clean(this.options.debugDir);

            if (this.options.includeLark)
                exitCode = this.copyLark();

            this.copyDirectory(this.options.templateDir, this.options.debugDir);
            this.copyDirectory(this.options.srcDir, this.options.debugDir, this.srcFolderOutputFilter);

            var compileResult = this.compileProject();

            Action.compileTemplates(this.options);

            exitCode = compileResult.exitCode;
        }
        catch (e) {

        }
        console.log('build end');
        Build.inProgress = false;
        return exitCode;
    }
}

export = Build;