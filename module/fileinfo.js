module.exports = Object.prototype.extend({
	constructor: function(path, stat){
		this.path = path;
		this.stat = stat;
	},

	toJSON: function(){
		var data = {
			name: require('path').basename(this.path),
			type: this.stat.isFile() ? 'file' : 'dir',
			size: this.stat.size,
			atime: this.stat.atime,
			mtime: this.stat.mtime,
			ctime: this.stat.ctime
		};

		if( this.childNodes ) data.childNodes = this.childNodes;
		if( this.listed ) data.listed = this.listed;

		return data;
	}
});
