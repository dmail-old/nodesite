module.exports = {
	title: 'page',
	// ce code seras éxécuté coté client lorsque la page est affichée
	onpage: function(){
		
	}
};

/*
var footer = '';//'&copy; Tous droits r&eacute;serv&eacute;s - Angelblade ';
	var isAdmin = true;

	var OS = require('os');
	
	var html = String(page.getHTMLFile('footer').readSync());
	
	if( isAdmin ){
		footer+= 'Node js: '+process.version;
		footer+= ' memory usage ' + process.memoryUsage().rss;
		footer+= '<br> pateforme: '+ OS.platform();
		
		var cpus = OS.cpus();
		var models = {};
		
		cpus.each(function(cpu){
			if( cpu.model in models ) models[cpu.model]++;
			else models[cpu.model] = 1;			
		});
		
		var cpuStr = '';
		models = Object.forEach(models, function(number, name){
			cpuStr+= name + '<b> x ' + number + '</b>';
		});
		
		footer+= '<br> processeurs: '+ cpuStr;
		if( typeof DB != 'undefined' ){
			// $l_footer.= ' - MYSQL: '.DB::getVersion();
			// $l_footer.= ' - Requêtes: <a href="javascript:logsql()">'.DB::$counter.'</a>';
			// $l_footer.= ' - Temps d\'execution : '.round(microtime(true) - $begin_time, 2).' secondes';
			// $l_footer.= '<script>function logsql(){ Array.each(req, function(part){ console.log(part);}); }; req = '.js_encode(DB::$history).';</script>';
		}
	}
	
	var data = {
		footer: footer
	};
	
	page.echo(html.parse(data));
*/