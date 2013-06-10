module.exports = Item('proto').extend('fileinfo', {
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

		if( this.children ) data.children = this.children;
		if( this.listed ) data.listed = this.listed;

		return data;
	}
});
