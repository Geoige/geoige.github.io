var running = false;

window.onload = function() {
	document.getElementById('run').addEventListener('click', function (e) {
		if (running) return;
		var error = document.getElementById('error');
		error.innerText = '';
		var fileInput = document.getElementById('fileInput');
		if (!fileInput.files.length) return error.innerText = 'No files selected';
		run();
	});
}

var runParallel = function (tasks, callback) {
	var error = false;
	var done = 0;
	var results = [];
	tasks.forEach(function (task, i) {
		task(function (err, res) {
			if (error) return;
			if (err) {
				error = true;
				return callback(err);
			}
			results[i] = res;
			done++;
			if (done === tasks.length) return callback(null, results);
		});
	});
}

var run = function () {
	running = true;
	var loader = document.getElementById('loader');
	loader.style.display = 'block';
	var tasks = Array.from(fileInput.files).map(function (file) {
		return function (cb) {
			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					var result = parseFile(reader.result);
					return cb(null, result);
				} catch (e) {
					return cb(e)
				}
			};

			reader.readAsArrayBuffer(file);
		};
	});

	runParallel(tasks, function (err, res) {
		running = false;
		displayResults(res);
		loader.style.display = 'none';
	});
}

var parseFile = function (mca) {
	var nbts = anvilToNbt.getNbts(mca);
	var chunks = [];
	var parser = new nbtParser.NBTParser();
	nbts.forEach(function (nbt) {
		var chunk = parser.parse(nbt);
		chunks.push(chunk);
	});
	return chunks;
}

var displayResults = function (results) {
	var entities = []
	results.forEach(function (result) {
		result.forEach(function (chunk) {
			chunk.Level.Entities.forEach(function (entity) {
				if (entity.id !== 'minecraft:item') return;
				var pos = entity.Pos
				pos = pos[0].toFixed(3) + ' / ' + pos[1].toFixed(5) + ' / ' + pos[2].toFixed(3);
				entities.push({
					id: entity.Item.id.substring(10),
					pos
				});
			});
		});
	});

	var resultsEl = document.getElementById('results');
	var tableEl = document.createElement('table');
	resultsEl.appendChild(tableEl);
	tableEl.innerHTML = '<thead><tr><th>Entity</th><th>Position (XYZ)</th></tr></thead>';
	var tbodyEl = document.createElement('tbody');
	tableEl.appendChild(tbodyEl);

	entities.forEach(function (entity) {
		tbodyEl.innerHTML += '<tr><td>' + entity.id + '</td><td>' + entity.pos + '</td></tr>';
	});
}