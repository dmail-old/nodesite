// create a fake and promised version of the fs

require('promise-extra');
require('array/prototype/find');
var proto = require('@dmail/proto');

var FakeNode = proto.create({
	content: '',
	type: 'file',
	children: null,

	constructor: function(path){
		this.path = path;
	},

	truncate: function(length){
		this.content = this.content.slice(0, length);
	}
});

var FakeStat = proto.create({
	dev: 0,
	ino: 0,
	mode: 0,
	nlink: 0,
	uid: 0,
	gid: 0,
	rdev: 0,
	size: 0,
	blksize: 4096,
	blocks: 8,
	atime: new Date(),
	mtime: new Date(),
	ctime: new Date(),
	birthtime: new Date(),

	constructor: function(node){
		this.node = node;
		this.mode = node.mode;
		this.uid = node.uid;
		this.gid = node.gid;
	},

	isFile: function(){
		return this.node.type === 'file';
	},

	isDirectory: function(){
		return this.node.type === 'directory';
	},

	isBlockDevice: function(){

	},

	isCharacterDevice: function(){

	},

	isSymbolicLink: function(){

	},

	isFIFO: function(){

	},

	isSocket: function(){

	}
});

// les versions sync sont comme les versions non sync puisque tout est sync en fait

var FakeFileSystem = proto.create({
	constructor: function(tree){
		this.nodes = [];
	},

	getNode: function(path){
		return this.nodes.find(function(node){
			return node.path === path;
		});
	}
});

var methods = {
	exists: function(path){
		return this.getNode(path) ? true : false;
	},

	rename: function(oldPath, newPath){
		var node = this.getNodeOrNotFound(oldPath);
		node.path = newPath;
	},

	ftruncate: function(fd, length){
		var node = this.getNodeOrNotFound(fd);
		node.truncate(length);
	},

	truncate: function(path, length){
		var node = this.getNodeOrNotFound(path);
		node.truncate(length);
	},

	chown: function(path, uid, gid){
		var node = this.getNodeOrNotFound(path);
		node.uid = uid;
		node.gid = gid;
	},

	fchown: function(fd, uid, gid){
		var node = this.getNodeOrNotFound(fd);
		node.uid = uid;
		node.gid = gid;
	},

	chmod: function(path, mod){
		var node = this.getNodeOrNotFound(path);
		node.mod = mod;
	},

	fchmod: function(fd, mod){
		var node = this.getNodeOrNotFound(path);
		node.mod = mod;
	},

	stat: function(path){
		return new FakeStat(this.getNodeOrNotFound(path));
	},

	lstat: function(){
		// if node is symlink, follow it
	},

	fstat: function(fd){
		return new FakeStat(this.getNodeOrNotFound(fd));
	},

	link: function(srcpath, destpath){
		var node = this.getNodeOrNotFound(srcpath);
		var link = new Node(destpath);
		link.type = 'link';
		link.origin = node;
	},

	readlink: function(path){
		var node = this.getNodeOrNotFound(path);
		return node.origin.path;
	},

	unlink: function(path){
		var node = this.getNodeOrNotFound(path);
		this.nodes.remove(node);
		node.unlink();
	},

	rmdir: function(path){
		var node = this.getNodeOrNotFound(path);
		if( node.type != 'dir' ){
			throw new Error('not a directory');
		}
		if( node.children.length ){
			throw new Error('directory must be empty');
		}
		this.nodes.remove(node);
	},

	mkdir: function(path, mod){
		var exists = this.getNode(path);
		if( exists ){
			throw new Error('dir already exists');
		}
		var node =  new Node(path);
		if( mod ) node.mod = mod;
	},

	readdir: function(path){
		var node = this.getNodeOrNotFound(path);
		return node.children.map(function(child){
			return child.slice(node.path.length);
		});
	},

	close: function(fd){
		var node = this.getNodeOrNotFound(fd);
		node.state = 'closed';
	},

	open: function(path, flags, mode){
		var exists = this.getNode(path);
		if( exists ){
			throw new Error('already exists');
		}
		var node = new Node(path);
		if( mode ) node.mode = mode;
	},

	utimes: function(path, atime, mtime){
		var node = this.getNodeOrNotFound(path);
		node.atime = atime;
		node.mtime = mtime;
	},

	futimes: function(fd, atime, mtime){
		var node = this.getNodeOrNotFound(fd);
		node.atime = atime;
		node.mtime = mtime;
	},

	fsync: function(fd){

	},

	write: function(fd, buffer, offset, length, position){
		var node = this.getNodeOrNotFound(fd);

		offset = offset || 0;
		length = length || buffer.length;
		buffer = buffer.slice(offset, length);
		position = position || node.content.length;

		node.content = node.content.slice(0, position) + buffer + node.content.slice(position + buffer.length);
	},

	//write: function(fd, data, position, encoding){},

	read: function(fd, buffer, offset, length, position){
		var node = this.getNodeOrNotFound(fd);
		var read = node.content.slice(position, position + length);

		return read.length;
	},

	readFile: function(path){
		var node = this.getNodeOrNotFound(path);

		if( node.type != 'file' ){
			throw new Error('not file');
		}
		return node.content;
	},

	writeFile: function(path, data){
		var node = this.getNodeOrNotFound(path);

		if( node.type != 'file' ){
			throw new Error('not file');
		}
		node.content = data;
	},

	appendFile: function(path, data){
		var node = this.getNodeOrNotFound(path);

		if( node.type != 'file' ){
			throw new Error('not file');
		}
		node.content+= data;
	}
};

[
	'rename',
	'ftruncate',
	'truncate',
	'chown',
	'fchown',
	'lchown',
	'chmod',
	'fchmod',
	'lchmod',
	'stat',
	'lstat',
	'fstat',
	'link',
	'symlink',
	'readlink',
	'realpath',
	'unlink',
	'rmdir',
	'mkdir',
	'readdir',
	'close',
	'open',
	'utimes',
	'futimes',
	'write',
	'read',
	'readFile',
	'writeFile',
	'appendFile',
	'exists',
	'access',
].forEach(function(name){
	FakeFileSystem.prototype[name] = function(){
		var self = this, args = arguments;

		return new Promise(function(resolve){
			resolve(self.methods[name].apply(self, args));
		});
	};
	FakeFileSystem.prototype[name + 'Sync'] = FakeFileSystem.prototype[name];
});

module.exports = FakeFileSystem;