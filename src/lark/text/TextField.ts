﻿//////////////////////////////////////////////////////////////////////////////////////
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

module lark {

    export enum TextFieldFlags {
        None = 0x000000,
        TextDirty = 0x000001,
        FormatDirty = 0x000002,
        MultilineDirty = 0x000004,
        LineDirty = TextDirty | FormatDirty | MultilineDirty ,
        Dirty = LineDirty
    }


    /**
     * TextFormat 类描述字符格式设置信息。使用 TextFormat 类可以为文本字段创建特定的文本格式。
     * 您可以将文本格式应用于静态文本字段和动态文本字段。
     * 
     */
    export interface ITextFieldStyle extends ITextStyle {

        /**
         * 表示段落的对齐方式。left 或 right
         */
        align?: string;

        /**
         * 一个整数，表示行与行之间的垂直间距（称为前导）量。
         */
        leading?: number;
    }

    

    var BaseStyle: ITextFieldStyle = {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 14,
        color: 0x000000,
        bold: false,
        italic: false,
        float: "",
        align: Align.LEFT,
        leading: 0.2,
        verticalAlign: Align.BOTTOM
    }
    
    var SplitRegex = /(?=[\u00BF-\u1FFF\u2C00-\uD7FF]|\b)(?![。，！、》…）)}”】\.\,\!\?\]\:])/;
    var LineBreaks = /\r|\n/;

    /**
     * TextField 类用于创建显示对象以显示和输入文本。 
     * 可以使用 TextField 类的方法和属性对文本字段进行操作。
     * Lark 提供了多种在运行时设置文本格式的方法。TextFormat 类允许您设置 TextField 对象的字符和段落格式。
     * 
     */
    export class TextField extends DisplayObjectContainer {
        /**
         * 创建一个TextField对象
         */
        public constructor(text:string,format?:ITextFieldStyle) {
            super();
            this._text = text;
            this._style = this.normalizeStyle(format,BaseStyle);
            this.$invalidateContentBounds();
            
            this.addEventListener(Event.ENTER_FRAME, this.onEnterFrame, this);
        }


        protected _textFieldFlags: number = TextFieldFlags.Dirty;

        $setTextFieldFlags(flags: TextFieldFlags) {
            this._textFieldFlags |= flags;
        }

        protected _text: string;
        public get text(): string {
            return this._text;
        }
        public set text(value: string) {
            if (value == this._text)
                return;
            this._text = value;
            this.$setTextFieldFlags(TextFieldFlags.TextDirty);
        }

        protected _style: ITextFieldStyle;
        public get style(): ITextFieldStyle {
            return this._style;
        }
        public set style(value: ITextFieldStyle) {
            value = this.normalizeStyle(value, BaseStyle);
            this._style = value;
            this.$setTextFieldFlags(TextFieldFlags.FormatDirty);
        }

        protected _multiline = true;
        public get multiline(): boolean {
            return this._multiline;
        }
        public set multiline(value: boolean) {
            if (value == this._multiline)
                return;
            this._multiline = value;
            this.$setTextFieldFlags(TextFieldFlags.MultilineDirty);
        }

        protected _width:number = NaN;
        public get width(): number {
            return this._width || this.$getTransformedBounds(this.$parent, Rectangle.TEMP).width;
        }
        public set width(value: number) {
            if (value == this._width)
                return;
            this._width = value;
            this.$setTextFieldFlags(TextFieldFlags.Dirty);
        }

        protected _height: number = NaN;
        public get height(): number {
            return this._height || this.$getTransformedBounds(this.$parent, Rectangle.TEMP).height;
        }
        public set height(value: number) {
            if (value == this._height)
                return;
            this._height = value;
            this.$setTextFieldFlags(TextFieldFlags.Dirty);
        }

        private onEnterFrame() {
            if ((this._textFieldFlags & TextFieldFlags.LineDirty) != 0) {
                this.$createLines();
                this.$updateChildren();
                this._textFieldFlags = 0;
            }
        }

        private textLines: Array<TextSpan> = []; 
        $createLines() {
            var lines = this._text.split(LineBreaks);

            if (!this._multiline)
                lines = [lines.join(' ')];

            var w = (this._width || 10000);
            var spanArrays = lines.map(t=> this.createLineSpan(t, w));
            this.textLines = Array.prototype.concat.apply([], spanArrays);
        }

        $updateChildren() {
            this.removeChildren();
            var width = this._width || (this.$stage ? this.$stage.stageWidth : 400);
            var height = this._height || 10000;
            var lines = this.textLines, format = this._style;

            var xRate: number = 0;
            if (format.align == "center") 
                xRate = 0.5;
            else if (format.align == "right") 
                xRate = 1;

            var y = format.leading * format.fontSize / 2;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                this.addChild(line);
                line.y = y;
                line.x = (width - line.textWidth) * xRate;
                y += lines[i].height + format.leading * format.fontSize;
                if (this._multiline == false || y > height)
                    break;
            }
        }

        protected createLineSpan(lineString: string,width:number): TextSpan[]{
            var textAtoms = lineString.split(SplitRegex);
            var currentWidth = 0;
            var style = this._style;
            var lines: TextSpan[] = [];
            var line = "";
            for (var i = 0; i < textAtoms.length; i++) {
                var atom = textAtoms[i];
                var w = TextMeasurer.measureText(atom, this._style);
                var testW = currentWidth + w;
                if (testW < width) {
                    line += atom;
                    currentWidth = testW;
                }
                else {
                    lines.push(new TextSpan(line, style, currentWidth, line.length));
                    line = atom;
                    currentWidth = w;
                }
            }
            lines.push(new TextSpan(line, style, currentWidth, line.length));
            return lines;
        }

        protected normalizeStyle(change: ITextFieldStyle,base:ITextFieldStyle = this._style): ITextFieldStyle {
            var style: ITextStyle = {};
            for (var p in base) {
                if (base[p] !== undefined)
                    style[p] = base[p];
            }

            for (var p in change) {
                if (change[p] !== undefined)
                    style[p] = change[p];
            }

            return style;
        }
    }
}