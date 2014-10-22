'use strict';

var fs = require('fs'),
	path = require('path'),
	through = require('through2'),
    gutil = require('gulp-util'),
    PLUGIN_NAME;

PLUGIN_NAME = 'gulp-file-copy';

var stat = fs.stat;

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
var copy = function(start, dst, _src){

	var readable, writable;
	var _dst;

	_src = _src.replace(/\\/g, '/');
	start = start.replace('./', '');
	_dst = dst + _src.replace(start, '');

	console.log(start, dst, _src);

	stat( _src, function( err, st ){
		if( err ){
			throw err;
		}

		// 判断是否为文件
		if(st.isFile()){
			// 创建读取流
			readable = fs.createReadStream( _src );
			// 创建写入流
			writable = fs.createWriteStream( _dst );
			// 通过管道来传输流
			readable.pipe( writable );
		}
		// 如果是目录则递归调用自身
		else if( st.isDirectory() ){
			exists( _src, _dst, copy );
		}
	});
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function( src, dst, callback, source){
	fs.exists( dst, function( exists ){
		// 已存在
		if( exists ){
			callback( src, dst, source);
		}
		// 不存在
		else{
			fs.mkdir( dst, function(){
				callback( src, dst, source);
			});
		}
	});
};


module.exports = function (dst, options) {

	return through.obj(function (file, enc, cb){
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			return cb();
		}

		var rel = path.relative(file.cwd, file.path);
		exists(options.start, dst, copy, rel);
		this.push(file);
		cb();
	});

}

